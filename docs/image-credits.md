# 外部の画像の出典とライセンス

このサイトで使っている、ほかのサイトから持ってきた画像の一覧です。画像を足すときは、必ずここにも書き足してください。

- 使ってよいのは、パブリックドメイン（PD・CC0）か、再利用が許されたライセンス（CC BY など）の画像だけです。
- CC BY の画像は、ページに作者名・ライセンス名とそのリンク・加工したかどうかを書く必要があります（`image` ブロックの `credit`・`license`・`licenseUrl`）。
- CC BY-SA の画像を加工したら、加工した画像も同じライセンスで公開する必要があります。
- 写真に写っている看板や作品にも別の権利があることがあります。そういう写真は避けます。

| ファイル                                          | 内容                                   | 作者・出典                                                                            | ライセンス         | 元のページ                                                              | 使っている場所                            |
| ------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- | ----------------------------------------- |
| `public/uploads/design/snow-cholera-map.jpg`      | ジョン・スノウのコレラの地図（1854年） | John Snow, On the Mode of Communication of Cholera, 2nd ed., 1855（地図は1854年作成） | パブリックドメイン | https://commons.wikimedia.org/wiki/File:Snow-cholera-map-1.jpg          | `src/content/design/data-analysis.yaml`   |
| `public/uploads/design/nightingale-mortality.jpg` | ナイチンゲールの鶏頭図（1858年）       | Florence Nightingale, Notes on Matters Affecting the Health…of the British Army, 1858 | パブリックドメイン | https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg       | `src/content/design/data-analysis.yaml`   |
| `public/uploads/design/tactile-paving.jpg`        | 日本の点字ブロック（黄色）             | Midnightcomm（Wikimedia Commons）                                                     | CC BY 4.0          | https://commons.wikimedia.org/wiki/File:Tactile_pavers_Japan_yellow.jpg | `src/content/design/human-interface.yaml` |

どれも Wikimedia Commons の縮小版（幅 1280px）を、縮小のほかは加工せずに使っています。CC BY の画像は、ページに作者・ライセンス・元のページを表示しています。ライセンスは 2026年10月24日に Commons のファイルページで確認しました。

## ほかのサービスのロゴ

ほかのサービスへのリンクに使うロゴです。ロゴの権利はそれぞれの会社にあり、各社のガイドラインの範囲で使います。

| ファイル                                   | 内容                      | 出典                                                                                             | 使ってよい範囲（ガイドライン）                                                                                                                                                         | 使っている場所                                               |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `public/uploads/brand/timetree-symbol.svg` | TimeTree のシンボル（緑） | TimeTree ブランドキット（https://timetreeapp.com/intl/ja/brand-kit）の `SVG/TimeTree_Symbol.svg` | ロゴはシンボルとして使える。提供されたファイルをそのまま使い、形・色・スタイルを変えない。他のグラフィック要素と組み合わせない。変形、枠線などの効果、ガイドラインにない色は使わない。 | ヘッダーの右のアイコン（`src/components/SocialLinks.astro`） |

TimeTree のシンボルは、ブランドキットのファイルを一字も変えずに置いています（2026年10月26日に確認）。表示の大きさだけを変え、色を変える処理や、背景の丸などの効果は付けていません。Discord のアイコンは Simple Icons（CC0）の形で、`src/lib/site.ts` に入っています。
