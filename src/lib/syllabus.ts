// 岡山県立大学のシラバスへのリンクをつくる。
// 年度が変わったら SYLLABUS_YEAR を変え、各授業のページが同じ授業のままかを確かめる
// (存在しないページは「見つかりません」にならず、大学の一般のページが出るので、見た目では気付きにくい)。
export const SYLLABUS_YEAR = 2026;
export const syllabusTop = `https://www.oka-pu.ac.jp/syllabus/${SYLLABUS_YEAR}/index.html`;
export const syllabusUrl = (path: string) => `https://www.oka-pu.ac.jp/syllabus/${SYLLABUS_YEAR}/${path}_ja_JP.html`;
