import { readFile, writeFile, mkdir } from "node:fs/promises";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "data/claims.json";

if (!inputPath) {
  throw new Error("Usage: node scripts/import-claims.mjs <claims.md> [output.json]");
}

const input = await readFile(inputPath, "utf8");
const sectionIds = {
  "Forstater / Rowling's initial involvement": "forstater-involvement",
  "Rowling's Twitter experiences / Magdalen Berns": "twitter-magdalen-berns",
  "Reaction to Forstater support": "reaction-forstater-support",
  "“TERF” and gender-critical women": "terf-gender-critical-women",
  "Rowling's philanthropy and stated motivations": "philanthropy-motivations",
  "Rowling's adolescence / personal history": "adolescence-personal-history",
  "Youth transition / detransition": "youth-transition-detransition",
  "Lisa Littman / ROGD": "littman-rogd",
  "Suicide / Tavistock": "suicide-tavistock",
  "Desistance / transition outcomes": "desistance-transition-outcomes",
  "Women, misogyny and contemporary culture": "women-misogyny-culture",
  "Language concerning women": "language-concerning-women",
  "Rowling's abuse and sexual-assault history": "abuse-sexual-assault-history",
  "Violence against transgender people": "violence-transgender-people",
  "Single-sex spaces / safeguarding": "single-sex-spaces-safeguarding",
  "Scottish gender-recognition reform": "scottish-gender-recognition-reform",
  "Abuse following her June 2020 statements": "abuse-june-2020-statements",
  "Rowling's stated position": "rowling-stated-position",
  "Wider intimidation / public opinion claims": "wider-intimidation-public-opinion"
};
let sectionId;
const claims = [];

for (const rawLine of input.split(/\r?\n/)) {
  const line = rawLine.trim();
  const heading = line.match(/^###\s+(.+)$/);
  if (heading) {
    sectionId = sectionIds[heading[1]];
    if (!sectionId) throw new Error(`Unknown section heading: ${heading[1]}`);
    continue;
  }

  const item = line.match(/^(\d+)\.\s+(.+)$/);
  if (!item) continue;

  const number = Number(item[1]);
  claims.push({
    id: `claim-${String(number).padStart(3, "0")}`,
    number,
    statement: item[2].replace(/\*\*/g, ""),
    sectionId,
    reference: {
      paragraphIds: paragraphIdsForClaim(number)
    }
  });
}

const expectedNumbers = Array.from({ length: claims.length }, (_, index) => index + 1);
const actualNumbers = claims.map(({ number }) => number);
if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) {
  throw new Error("Claim numbers are not contiguous starting at 1");
}

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(claims, null, 2)}\n`);
console.log(`Wrote ${claims.length} claims to ${outputPath}`);

function paragraphIdsForClaim(number) {
  const ranges = [
    [1, 6, ["p002"]], [7, 18, ["p003"]],
    [19, 23, ["p004"]], [24, 33, ["p005"]], [34, 39, ["p006"]],
    [40, 49, ["p007"]], [50, 53, ["p008"]],
    [54, 60, ["p009"]], [61, 62, ["p010"]],
    [63, 72, ["p013"]], [73, 74, ["p014"]], [75, 76, ["p015"]],
    [77, 84, ["p016"]], [85, 88, ["p017"]], [89, 91, ["p018"]],
    [92, 94, ["p019"]], [95, 100, ["p020"]], [101, 112, ["p021"]],
    [113, 122, ["p022"]], [123, 126, ["p023", "p024", "p025"]], [127, 127, ["p025"]],
    [128, 141, ["p026"]], [142, 150, ["p027"]], [151, 156, ["p028"]],
    [157, 162, ["p029"]], [163, 168, ["p031"]], [169, 173, ["p033"]],
    [174, 176, ["p034", "p037"]], [177, 177, ["p034", "p035"]], [178, 183, ["p035"]],
    [184, 190, ["p036"]], [191, 199, ["p037"]], [200, 208, ["p038"]],
    [209, 210, ["p039"]], [211, 214, ["p035"]], [215, 216, ["p026"]],
    [217, 219, ["p013", "p028", "p029"]], [220, 221, ["p036", "p041"]],
    [222, 227, ["p041"]], [228, 232, ["p040"]], [233, 233, ["p032"]],
    [234, 235, ["p041"]], [236, 247, ["p042"]]
  ];

  const match = ranges.find(([start, end]) => number >= start && number <= end);
  if (!match) throw new Error(`No essay paragraph mapping for claim ${number}`);
  return match[2];
}
