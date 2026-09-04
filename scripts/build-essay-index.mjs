import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "data/essay-index.json";

if (!inputPath) {
  throw new Error("Usage: node scripts/build-essay-index.mjs <essay.html> [output.json]");
}

const summaries = [
  "Rowling introduces the essay as an explanation of her position on a contentious issue.",
  "She recounts supporting Maya Forstater and summarizes Forstater's employment tribunal case.",
  "She describes when and why she began researching gender identity and the kinds of people and material she consulted.",
  "She says an accidental Twitter like led to ongoing accusations and harassment.",
  "She recounts following and contacting Magdalen Berns and says the resulting social-media abuse increased.",
  "She says she anticipated threats and abuse when she publicly supported Forstater.",
  "She describes receiving mostly supportive correspondence raising concerns about policy, medicine, safeguarding, and rights.",
  "She explains her withdrawal from and return to Twitter and the hostile responses she says followed.",
  "She defines TERF and gives examples intended to show the label's broad application.",
  "She argues that fear of being called transphobic or a TERF has intimidated people and institutions.",
  "She poses the question of why she has chosen to speak publicly.",
  "She introduces five reasons for her concern about trans activism.",
  "Her first reason concerns her philanthropy, medical research funding, and the legal treatment of sex and gender.",
  "Her second reason concerns her experience with education, children's charity work, and safeguarding.",
  "Her third reason is her interest in freedom of speech.",
  "Her fourth reason concerns increasing transition and detransition among young women and possible links with homophobia.",
  "She claims the sex ratio of transition referrals reversed and cites a large increase in UK referrals of girls and autistic overrepresentation.",
  "She introduces Lisa Littman's research into adolescent transgender identification in the United States.",
  "She quotes Littman describing parent reports of clustered transgender identification and possible peer influence.",
  "She summarizes Littman's account of social-media influence and rapid-onset gender dysphoria.",
  "She describes criticism, re-review, republication, and alleged professional consequences surrounding Littman's paper.",
  "She describes suicide-related arguments about youth transition and quotes psychiatrist Marcus Evans disputing their evidentiary basis.",
  "She connects accounts by young trans men with her own adolescent OCD and her father's preference for a son.",
  "She reflects on feeling mentally detached from sex in youth and cites Colette and Simone de Beauvoir.",
  "She describes books and music as coping mechanisms for mental-health struggles and discomfort with expectations of femininity.",
  "She discusses transition outcomes, desistance estimates, transgender acquaintances, historical assessments, and Gender Recognition Certificates.",
  "She argues that misogyny and harms affecting girls have worsened, citing pornography, Trump, incels, and violent rhetoric.",
  "She rejects arguments minimizing sex-based commonality and describes correspondence supporting her concerns.",
  "She objects to some inclusive terminology concerning female bodies and explains why she finds it alienating.",
  "She introduces her fifth reason for concern.",
  "She publicly discloses surviving domestic abuse and sexual assault and says she consulted her daughter before doing so.",
  "She says the disclosure is intended to express solidarity with women concerned about single-sex spaces.",
  "She recounts escaping a violent first marriage and describes lasting trauma responses despite present safety.",
  "She relates her experience of male violence to her empathy for trans women killed by violent men.",
  "She states that most transgender people pose no threat and discusses their vulnerability to intimate-partner and sex-industry violence.",
  "She argues that gender-identity-based access to women's facilities may be exploited by predatory men.",
  "She describes reading about Scottish gender-recognition reform and says it triggered memories of a sexual assault.",
  "She recounts posting about sex on Twitter and lists the abuse and threats she says she then received.",
  "She acknowledges affirmations of trans rights while criticizing the social pressure to conform.",
  "She says women who contacted her feared doxxing, job loss, loss of livelihood, and violence.",
  "She states her opposition to the movement and frames it around speech, vulnerable groups, and single-sex spaces.",
  "She describes cross-party gender-critical organizing and argues that use of the TERF label may increase interest in radical feminism.",
  "She says she seeks neither pity nor victim status and asks readers to recognize people's complex histories.",
  "She closes by asking that women voicing concerns receive empathy and freedom from threats and abuse."
];

const html = await readFile(inputPath, "utf8");
const contentStart = html.indexOf('<div class="entry-content');
const contentEnd = html.indexOf("</article>", contentStart);
if (contentStart === -1 || contentEnd === -1) {
  throw new Error("Could not locate the essay content in the HTML");
}

const content = html.slice(contentStart, contentEnd);
const paragraphs = [...content.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)].map(
  ([, paragraph]) => decodeHtml(paragraph)
);

if (paragraphs.length !== summaries.length) {
  throw new Error(`Found ${paragraphs.length} paragraphs but have ${summaries.length} summaries`);
}

const index = {
  essay: {
    title: "J.K. Rowling Writes about Her Reasons for Speaking out on Sex and Gender Issues",
    author: "J.K. Rowling",
    publishedOn: "2020-06-10",
    url: "https://www.jkrowling.com/opinions/j-k-rowling-writes-about-her-reasons-for-speaking-out-on-sex-and-gender-issues/"
  },
  indexedOn: "2026-09-04",
  paragraphs: paragraphs.map((text, index) => ({
    id: `p${String(index + 1).padStart(3, "0")}`,
    number: index + 1,
    selector: `.entry-content > p:nth-of-type(${index + 1})`,
    summary: summaries[index],
    wordCount: text.split(/\s+/).filter(Boolean).length,
    contentHash: createHash("sha256").update(text).digest("hex")
  }))
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote an index of ${paragraphs.length} paragraphs to ${outputPath}`);

function decodeHtml(value) {
  const entities = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    nbsp: " ",
    quot: '"',
    rdquo: "”",
    rsquo: "’"
  };

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match)
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/\s+/g, " ")
    .trim();
}
