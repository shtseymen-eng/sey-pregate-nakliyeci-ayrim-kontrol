import JSZip from "jszip";
import { REPORT_LAYOUT } from "@/config/report-layout";
import type { ReportModel } from "@/types/report";

const RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const DRAWING_RELATIONSHIP =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing";
const CHART_RELATIONSHIP =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
const DRAWING_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.drawing+xml";
const CHART_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";

interface WorkbookSheet {
  name: string;
  path: string;
}

interface ChartAnchor {
  fromColumn: number;
  fromRow: number;
  toColumn: number;
  toRow: number;
}

interface ChartTarget extends WorkbookSheet {
  categoryColumn: string;
  valueColumn: string;
  startRow: number;
  endRow: number;
  values: number[];
  anchor: ChartAnchor;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function unescapeXml(value: string): string {
  return value
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

function xmlAttribute(fragment: string, name: string): string | undefined {
  return fragment.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function normalizeWorkbookTarget(target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  return target.startsWith("xl/") ? target : `xl/${target}`;
}

async function readWorkbookSheets(zip: JSZip): Promise<WorkbookSheet[]> {
  const workbookXml = await zip.file("xl/workbook.xml")?.async("text");
  const relationshipsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("text");
  if (!workbookXml || !relationshipsXml) {
    throw new Error("Excel çalışma kitabı sayfa ilişkileri okunamadı.");
  }

  const targets = new Map<string, string>();
  for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)) {
    const id = xmlAttribute(match[1], "Id");
    const target = xmlAttribute(match[1], "Target");
    if (id && target) targets.set(id, normalizeWorkbookTarget(target));
  }

  const sheets: WorkbookSheet[] = [];
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/g)) {
    const name = xmlAttribute(match[1], "name");
    const relationshipId = xmlAttribute(match[1], "r:id");
    const target = relationshipId ? targets.get(relationshipId) : undefined;
    if (name && target) sheets.push({ name: unescapeXml(name), path: target });
  }
  return sheets;
}

function quoteSheetName(name: string): string {
  return `'${name.replaceAll("'", "''")}'`;
}

function nextRelationshipId(xml: string): string {
  let highest = 0;
  for (const match of xml.matchAll(/\bId="rId(\d+)"/g)) {
    highest = Math.max(highest, Number(match[1]));
  }
  return `rId${highest + 1}`;
}

function appendRelationship(
  xml: string,
  relationship: { id: string; type: string; target: string },
): string {
  const node = `<Relationship Id="${relationship.id}" Type="${relationship.type}" Target="${relationship.target}"/>`;
  return xml.replace("</Relationships>", `${node}</Relationships>`);
}

function relationshipsDocument(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${RELATIONSHIPS_NAMESPACE}"></Relationships>`;
}

function insertWorksheetDrawing(xml: string, relationshipId: string): string {
  const drawing = `<drawing r:id="${relationshipId}"/>`;
  const extensionIndex = xml.lastIndexOf("<extLst");
  if (extensionIndex >= 0) {
    return `${xml.slice(0, extensionIndex)}${drawing}${xml.slice(extensionIndex)}`;
  }
  return xml.replace("</worksheet>", `${drawing}</worksheet>`);
}

function buildDrawingXml(chartRelationshipId: string, chartId: number, anchor: ChartAnchor): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <xdr:twoCellAnchor editAs="oneCell">
    <xdr:from><xdr:col>${anchor.fromColumn}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${anchor.fromRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>${anchor.toColumn}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${anchor.toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr><xdr:cNvPr id="${chartId + 1}" name="Saatlik Kayıt Yoğunluğu ${chartId}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
      <xdr:xfrm/>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${chartRelationshipId}"/></a:graphicData></a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`;
}

function stringCache(values: string[]): string {
  return `<c:strCache><c:ptCount val="${values.length}"/>${values
    .map((value, index) => `<c:pt idx="${index}"><c:v>${escapeXml(value)}</c:v></c:pt>`)
    .join("")}</c:strCache>`;
}

function numberCache(values: number[]): string {
  return `<c:numCache><c:formatCode>#,##0</c:formatCode><c:ptCount val="${values.length}"/>${values
    .map((value, index) => `<c:pt idx="${index}"><c:v>${value}</c:v></c:pt>`)
    .join("")}</c:numCache>`;
}

function buildChartXml(target: ChartTarget, chartId: number): string {
  const sheetName = quoteSheetName(target.name);
  const categoriesFormula = escapeXml(
    `${sheetName}!$${target.categoryColumn}$${target.startRow}:$${target.categoryColumn}$${target.endRow}`,
  );
  const valuesFormula = escapeXml(
    `${sheetName}!$${target.valueColumn}$${target.startRow}:$${target.valueColumn}$${target.endRow}`,
  );
  const categories = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
  const categoryAxisId = 100000 + chartId * 2;
  const valueAxisId = categoryAxisId + 1;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:date1904 val="0"/><c:lang val="tr-TR"/><c:roundedCorners val="0"/>
  <c:chart>
    <c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="tr-TR" sz="1100" b="1"/><a:t>Saatlik Kayıt Yoğunluğu</a:t></a:r></a:p></c:rich></c:tx><c:layout/><c:overlay val="0"/></c:title>
    <c:autoTitleDeleted val="0"/>
    <c:plotArea>
      <c:layout/>
      <c:barChart>
        <c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>
        <c:ser>
          <c:idx val="0"/><c:order val="0"/><c:tx><c:v>Kayıt</c:v></c:tx>
          <c:spPr><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></a:ln></c:spPr>
          <c:cat><c:strRef><c:f>${categoriesFormula}</c:f>${stringCache(categories)}</c:strRef></c:cat>
          <c:val><c:numRef><c:f>${valuesFormula}</c:f>${numberCache(target.values)}</c:numRef></c:val>
        </c:ser>
        <c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>
        <c:gapWidth val="65"/><c:axId val="${categoryAxisId}"/><c:axId val="${valueAxisId}"/>
      </c:barChart>
      <c:catAx><c:axId val="${categoryAxisId}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="${valueAxisId}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx>
      <c:valAx><c:axId val="${valueAxisId}"/><c:scaling><c:orientation val="minMax"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:numFmt formatCode="#,##0" sourceLinked="0"/><c:tickLblPos val="nextTo"/><c:crossAx val="${categoryAxisId}"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>
    </c:plotArea>
    <c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/><c:showDLblsOverMax val="0"/>
  </c:chart>
  <c:printSettings><c:headerFooter/><c:pageMargins b="0.75" l="0.7" r="0.7" t="0.75" header="0.3" footer="0.3"/><c:pageSetup/></c:printSettings>
</c:chartSpace>`;
}

async function attachChart(
  zip: JSZip,
  target: ChartTarget,
  chartId: number,
): Promise<void> {
  const worksheetFile = zip.file(target.path);
  const worksheetXml = await worksheetFile?.async("text");
  if (!worksheetXml) throw new Error(`Grafik sayfası bulunamadı: ${target.name}`);

  const sheetFileName = target.path.split("/").at(-1)!;
  const worksheetRelsPath = `xl/worksheets/_rels/${sheetFileName}.rels`;
  let worksheetRelsXml =
    (await zip.file(worksheetRelsPath)?.async("text")) ?? relationshipsDocument();
  const drawingRelationshipId = nextRelationshipId(worksheetRelsXml);
  worksheetRelsXml = appendRelationship(worksheetRelsXml, {
    id: drawingRelationshipId,
    type: DRAWING_RELATIONSHIP,
    target: `../drawings/drawing${chartId}.xml`,
  });
  zip.file(worksheetRelsPath, worksheetRelsXml);
  zip.file(target.path, insertWorksheetDrawing(worksheetXml, drawingRelationshipId));

  const chartRelationshipId = "rId1";
  zip.file(
    `xl/drawings/drawing${chartId}.xml`,
    buildDrawingXml(chartRelationshipId, chartId, target.anchor),
  );
  zip.file(
    `xl/drawings/_rels/drawing${chartId}.xml.rels`,
    appendRelationship(relationshipsDocument(), {
      id: chartRelationshipId,
      type: CHART_RELATIONSHIP,
      target: `../charts/chart${chartId}.xml`,
    }),
  );
  zip.file(`xl/charts/chart${chartId}.xml`, buildChartXml(target, chartId));
}

function addContentTypeOverrides(xml: string, chartCount: number): string {
  const overrides: string[] = [];
  for (let id = 1; id <= chartCount; id += 1) {
    overrides.push(
      `<Override PartName="/xl/drawings/drawing${id}.xml" ContentType="${DRAWING_CONTENT_TYPE}"/>`,
      `<Override PartName="/xl/charts/chart${id}.xml" ContentType="${CHART_CONTENT_TYPE}"/>`,
    );
  }
  return xml.replace("</Types>", `${overrides.join("")}</Types>`);
}

export async function addHourlyCharts(
  workbookBytes: Uint8Array,
  model: ReportModel,
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(workbookBytes);
  const sheets = await readWorkbookSheets(zip);
  const hoursSheet = sheets.find((sheet) => sheet.name === REPORT_LAYOUT.hours.sheet);
  if (!hoursSheet) throw new Error("Saat Yoğunluk sayfası bulunamadı.");

  const targets: ChartTarget[] = [
    {
      ...hoursSheet,
      categoryColumn: "A",
      valueColumn: "B",
      startRow: REPORT_LAYOUT.hours.hourlyStartRow,
      endRow: REPORT_LAYOUT.hours.hourlyStartRow + 23,
      values: model.hourlyTotals,
      anchor: { fromColumn: 11, fromRow: 3, toColumn: 20, toRow: 29 },
    },
  ];

  const detailStartIndex = REPORT_LAYOUT.detail.firstSheetIndex - 1;
  model.topCarriers.forEach((carrier, index) => {
    const sheet = sheets[detailStartIndex + index];
    if (!sheet) return;
    targets.push({
      ...sheet,
      categoryColumn: "F",
      valueColumn: "G",
      startRow: REPORT_LAYOUT.detail.hourStartRow,
      endRow: REPORT_LAYOUT.detail.hourStartRow + 23,
      values: carrier.hourlyTotals,
      anchor: { fromColumn: 8, fromRow: 8, toColumn: 17, toRow: 29 },
    });
  });

  for (let index = 0; index < targets.length; index += 1) {
    await attachChart(zip, targets[index], index + 1);
  }

  const contentTypes = await zip.file("[Content_Types].xml")?.async("text");
  if (!contentTypes) throw new Error("Excel içerik türleri okunamadı.");
  zip.file("[Content_Types].xml", addContentTypeOverrides(contentTypes, targets.length));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
