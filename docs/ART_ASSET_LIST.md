<!-- このファイルは scripts/gen-art-list.mjs が つくります。手で 直さないこと。
     せつめい文を なおしたい ときは src/ui/icons/*.ts の JSDoc を なおして 作り直す。 -->

# 絵の 発注リスト(自動生成)

絵の かきかたの きまりは [ART_DIRECTION.md](./ART_DIRECTION.md) を 先に よむこと。
この ファイルは 「何を 何個 描くか」だけを ならべた ものです。

- かたち: **199**
- いろちがいを ふくめた のべ数: **521**
- せかい(ミニゲームの 背景): **59**

いろは かたち1つに つき 1まいの SVG を つくり、`#MAIN` / `#DARK` の 2つの
プレースホルダを アプリ側が いろに おきかえます(ART_DIRECTION.md の 「いろの しくみ」)。
つまり **描くのは かたちの 数だけ**で、いろちがいは 描かなくて よい。

## そざい・りょうり(67)

| ファイル | 何を 描くか | つかう いろ | 出る 大きさ(px) | どこで つかう |
|---|---|---|---|---|
| `bamboo.svg` | たけ。ふしの ある みどりの つつ 2本と、さきに はっぱ。たけのこ(tuber)とは べつ | cream green lime tan | 20〜30 | betchaGame / fukuotokoGame / gionGame / さとうきび ほか4 |
| `berry.svg` | つぶの みが ふさに なった もの(ブルーベリー・ぶどう・さくらんぼ)。まるを 6〜7つ かさねて ふさに し、うえに みじかい えだ | cream crimson dark deepgreen gold green lime navy purple violet yellow | — | さくらんぼ / さくらんぼ(しゅうかく中) / さくらんぼ(まだ はやい) / さんしょう ほか18 |
| `bigfish.svg` | 大きな さかな(まぐろ・かつお・さけ)。よこむき。fish より 体が ぶあつく しっぽが 大きい | blue navy pink tan | — | かつお / かつお(えんしゅつ3) / かつお(ねらう もの) / さけ ほか6 |
| `bottle.svg` | くびの ある びん(ジュース・しょうゆ・さけ)。中身の 色が ほんたい色。jar(ひろくちの びん)とは 見わける | amber brown crimson dark deepgreen gold gray green lime orange pink purple red tan teal violet yellow | — | ありたみかんの ジュース / いよかんジュース / いりこだし / うめシロップ ほか14 |
| `bowl.svg` | ふかい わん・どんぶり。中身が すこし もりあがって 見える。plate(たいらな さら)とは 見わける | amber brown cream crimson dark deepgreen gray green lime navy orange pink red silver sky tan teal white yellow | — | minyouGame / あなごめし / あゆめし / いかなごの くぎに ほか29 |
| `cake.svg` | ケーキ 1きれ。よこから 見た さんかく。上に みが 1つ | red tan violet | — | いちごさんの タルト / べにいもの タルト / アップルパイ |
| `cheese.svg` | チーズ(あなの あいた くさびがた) | yellow | — | チーズ |
| `chestnut.svg` | くり。とがった さきと、ざらざらの したはんぶん | brown | — | くり |
| `citrus.svg` | かんきつ(みかん・レモン・ゆず)。まるい みに はっぱ 1まいと へた | amber deepgreen gold lime orange yellow | — | StoryScene / かぼす / かぼす(しゅうかく中) / きんかん ほか12 |
| `clay.svg` | ねんどの かたまり。きれいな まるでは なく ゆがんだ かたまり。てで つかんだ あとが ある | brown | — | ねんど |
| `cloth.svg` | ぬの・わた の ぬの(たたんだ ぬの)。towel(ほしてある タオル)とは かたちで 見わける: cloth は かどが めくれた いちまい | navy pink red white | — | あわあいぞめの ハンカチ / きぬの スカーフ / べにばなぞめ / わた ほか1 |
| `cow.svg` | うし。まえは 「まるに ぶちが 2つ」で なにか わからなかった。 かおを 大きく して、つの・みみ・はなを はっきり させる | dark white | 46〜46 | ushioniGame / ぎゅうにゅう(たてもの) / わぎゅう |
| `crab.svg` | かに。ひらたい こうらと はさみ 2つ、あし 6本。正面から | amber crimson gold orange red | 54〜54 | kaniGame / えちぜん がにまつり / かに / かに(しゅうかく中) ほか3 |
| `craft.svg` | わりばし(きの こうげいひん)。めがね・コースターには つかわない (それぞれ glasses / mat が ある) | tan | — | よしのすぎの わりばし |
| `cucumber.svg` | きゅうり・ゴーヤー。ながい みに たての すじ。ゴーヤーは 表面が いぼいぼに 見える ように | cream deepgreen green lime | — | きゅうり / きゅうり(しゅうかく中) / きゅうり(まだ はやい) / ゆうがお ほか5 |
| `cup.svg` | ゆのみ(おちゃ・ジュース)。ほかの アイコンと 同じ 大きさに なる ように 64枠を つかう | amber brown cream deepgreen green lime orange purple sky tan teal white yellow | — | あさみやちゃ / あしがらちゃ / いせちゃ / しずおかちゃ ほか10 |
| `drop.svg` | みずの しずく。うえが とがって したが まるい | sky | — | みず |
| `eel.svg` | うなぎ・あなご。なめらかな S字の 体に せびれと あたま を つけて 「ぼう」ではなく「さかな」に 見える ように する | amber dark tan | — | あなご / あなご(えんしゅつ3) / あなご(ねらう もの) / うなぎ ほか3 |
| `egg.svg` | たまご 1つ。たてに ながい だえん | amber cream white | — | うずらのたまご / おんせんたまご / ゆでうずらたまご |
| `eggplant.svg` | なす。まるみの ある みに、みどりの がくと へた | lime pink purple violet | — | なす / なす(いろづきかけ) / なす(しゅうかく中) / なす(まだ はやい) ほか4 |
| `fish.svg` | ふつうの さかな(いわし・あじ・たい)。よこむき。せびれと しっぽ。bigfish より ほそい | amber blue brown cream crimson gray navy orange pink silver sky tan teal white | 34〜54 | fishGame / kingyoGame / yukimatsuriGame / あじ ほか32 |
| `flower.svg` | はな(ブロッコリー・べにばな・はなっこりー)。はなびら 5まいと まんなかの まる | cream crimson deepgreen green lime orange pink yellow | — | かいらくえん うめまつり / はなっこりー / はなっこりー(いろづきかけ) / はなっこりー(しゅうかく中) ほか10 |
| `ginger.svg` | しょうが。まえは 3つの まるで「ねずみのかお」に 見えて いた。 ごつごつした 塊+こぶ を つないだ かたちに する | tan | — | しょうが |
| `glasses.svg` | めがね(さばえの めがね) | silver | — | さばえの めがね |
| `grain.svg` | こくもつ(こめ・むぎ・とうもろこし)。つぶが たてに ならんだ ほ | amber brown cream gray tan yellow | — | yamayakiGame / こむぎ / こむぎ(しゅうかく中) / こめ ほか8 |
| `icecream.svg` | ソフトクリーム(sweet(だんご)で 代用すると 意味が わからない) | green white | — | まっちゃアイス / ソフトクリーム |
| `jar.svg` | ひろくちの びん(ジャム・つけもの)。大きな ふたが めじるし。bottle(くびの ある びん)とは 見わける | amber blue brown cream crimson dark deepgreen gold green lime navy orange pink purple red silver sky tan teal violet white yellow | — | あすかルビーの ジャム / あまおうの ジャム / いちごジャム / きゅうりの あさづけ ほか22 |
| `kamaboko.svg` | かまぼこ(いたに のった はんえん) | cream pink red | — | いろどりかまぼこ / かまぼこ / ささかまぼこ |
| `kiwi.svg` | キウイの 断面。まるい わの 中が しろく、たねの 点が わに ならぶ | brown lime | — | キウイ / キウイ(しゅうかく中) / キウイ(まだ はやい) |
| `leafy.svg` | はっぱの やさい(こまつな・レタス・しゅんぎく)。はっぱ 3〜4まいが たばに なって いる | deepgreen green lime teal | — | かつおな / かつおな(しゅうかく中) / こまつな / こまつな(しゅうかく中) ほか6 |
| `lotus.svg` | れんこんの 断面。あなが 7〜8こ ならぶ | cream white | — | いわくにれんこん / れんこん |
| `mango.svg` | マンゴー。ふっくらした たまごがた。へたが よこに つく | crimson orange | — | たいようのタマゴ / マンゴー / マンゴー(しゅうかく中) |
| `mat.svg` | コースター・ござ(いぐさの あみもの) | cream | — | いぐさの コースター |
| `melon.svg` | メロン・すいか。まるい みに あみめ(メロン)か しま(すいか) | deepgreen gold lime | — | すいか / すいか(しゅうかく中) / ブランドメロン / メロン ほか1 |
| `milk.svg` | ぎゅうにゅう。上が ひらいた 紙パック。cup(ゆのみ)とは 見わける | white yellow | — | ぎゅうにゅう / バター |
| `mushroom.svg` | きのこ。太い じくと まるい かさ。かさに 点が すこし | brown cream dark gray tan | — | きのこ / きのこ(いろづきかけ) / きのこ(しゅうかく中) / きのこ(まだ はやい) ほか7 |
| `noodle.svg` | めん(うどん・そば・ラーメン)。どんぶりから めんが もちあがって いる | amber brown cream dark gray tan white yellow | — | いずもそば / おろしそば / けんさきいかの いかそうめん / さぬきうどん ほか4 |
| `nut.svg` | らっかせい。まえの 絵は「円すい」で アイスの コーンに 見えて いた。 まめ2つぶ ぶんの くびれた からに する | brown cream lime tan | — | くり(いろづきかけ) / くり(しゅうかく中) / くり(まだ はやい) / ゆでらっかせい ほか1 |
| `octopus.svg` | たこ。まるい あたまと、見えている あし 3〜4本 | crimson red | — | かに(しゅうかく中) / たこ / たこ(しゅうかく中) |
| `onigiri.svg` | おにぎり。ごはんは いつも 白(c で ぬると のりと 見わけが つかない)。 いろは「うえに のせた ぐ」に つかうので、ぐの ちがいで 見わけられる | amber cream crimson dark green pink silver tan white | — | うめぼし / おうみまいの おにぎり / かんぴょうまき / さがびよりの おにぎり ほか5 |
| `onion.svg` | たまねぎ。まるい みに たての すじ、上に みどりの め | amber cream dark tan white | — | あわじたまねぎの まるやき / くろにんにく / たまねぎ / たまねぎ(しゅうかく中) ほか2 |
| `pearl.svg` | しんじゅ。かいを こく して、たまが 白く 浮くように する | silver white | — | しんじゅ / しんじゅ(しゅうかく中) / しんじゅの ネックレス |
| `pepper.svg` | ピーマン・ししとう。まるい 実だと りんごと 見わけが つかないので したが 3つに わかれた ピーマンの かたちに する | cream deepgreen green lime yellow | — | ししとう / ししとう(いろづきかけ) / ししとう(しゅうかく中) / ししとう(まだ はやい) ほか4 |
| `pineapple.svg` | パイナップル。あみめの みと、上に とがった はっぱ | amber | — | パイナップル / パイナップル(しゅうかく中) |
| `plate.svg` | たいらな さら。よこから 見た あさい さら。bowl(ふかい わん)とは 見わける | brown cream crimson deepgreen gray green lime pink silver sky teal white | 26〜26 | kaniGame / あじの ひらき / ありたやきの おさら / かつおの たたき ほか9 |
| `pod.svg` | さや(えだまめ・そらまめ・だいず)。ななめの ふとい さやに して まめの ふくらみを 3つ 見せる | cream dark green lime tan yellow | — | えだまめ / えだまめ(いろづきかけ) / えだまめ(しゅうかく中) / えだまめ(まだ はやい) ほか8 |
| `pot.svg` | なべ。ふたと とっての ある なべ。よこから | amber brown cream crimson dark green lime orange pink tan teal white | — | いもに / かがぼうちゃ / かきの どてなべ / かつおなの ぞうに ほか8 |
| `pottery.svg` | やきもの(とうき)。ろくろで つくった つぼ。くびが すこし しまって いる | brown cream dark gray red tan | — | StoryScene / かさまやき / くたにやき / しがらきやきの たぬき ほか3 |
| `pudding.svg` | プリン(カラメルの のった むしがし) | gold pink violet | — | いもようかん / たまごプリン / らくのうの ミルクプリン |
| `pufferfish.svg` | ふぐ。まるく ふくらんだ 体と ちいさな ひれ、とげ | cream white | — | fishGame / とらふぐの てっさ / ふぐ / ふぐ(えんしゅつ3) ほか1 |
| `root.svg` | ねの やさい(わさび・にんじん・しょうが)。したが とがった ねと、上に みどりの は | cream crimson lime orange | — | きんときにんじん / きんときにんじん(しゅうかく中) / きんときにんじん(まだ はやい) / ゆきしたにんじん ほか4 |
| `round.svg` | かたちが まるい だけの み(もも・トマト・すいか)。まるに へた 1つ。とくちょうの ある みは べつの かたちを つかう | amber brown cream crimson deepgreen gold green lime orange pink red tan | — | あかしやき / うめ / うめ(しゅうかく中) / かきのみ ほか20 |
| `salt.svg` | しお。もりあがった しろい やまと、ちいさな つぶ | cream white | — | しお / しお(たてもの) |
| `seaweed.svg` | かいそう(わかめ・こんぶ・のり)。ゆらゆらした ながい は 2まい | brown dark deepgreen green navy teal | — | ありあけの やきのり / のり / のり(しゅうかく中) / ほしわかめ ほか5 |
| `senbei.svg` | せんべい。まるく ひらたい やきもの。やきめの もようが すこし | amber brown cream tan white | — | いもせんべい / くさかせんべい / くまもとの こめせんべい / こめせんべい ほか1 |
| `shell.svg` | かい(かき・ほたて・しじみ)。おうぎがたの かいがらに すじ | amber cream dark gray orange | — | かき / かき(しゅうかく中) / しじみ / しじみ(しゅうかく中) ほか4 |
| `shrimp.svg` | えび。まるまった 体+しっぽの おうぎ+ひげ で 「えび」と わかる ように する | amber crimson gold pink red white | — | いせえび / いせえび(しゅうかく中) / いせえびの しおやき / さくらえび ほか5 |
| `silk.svg` | きいと・まゆ(いとまき)。まえの 絵は うすい 円だけで なにか わからなかった | cream white | — | きいと / まゆ / まゆ(しゅうかく中) / まゆ(まだ はやい) |
| `skewer.svg` | くし(やきとり・だんご)。まっすぐな くしに たまが 3つ | brown cream crimson gray pink red tan teal | — | あゆの しおやき / きりたんぽ / すみびやきの まぐろ / たまこんにゃく ほか5 |
| `squid.svg` | いか。さんかくの あたまと ひれ、あしが 何本か | cream navy tan | — | いか / いか(えんしゅつ3) / いか(ねらう もの) / するめ ほか1 |
| `stalk.svg` | ねぎ・せり など「くきの やさい」。はっぱは いつも みどり (c で ぬると white/cream/yellow の とき まっしろに 消えて しまう)。 c は じくの いろに つかう | amber cream deepgreen green lime tan white yellow | — | いぐさ / いぐさ(しゅうかく中) / うど / きにら ほか12 |
| `stone.svg` | いし。かどの ある ちいさな かたまり。rock より 小さく たいらな 面が ある | dark gray silver | — | yamayakiGame / てついし / チタン |
| `strawberry.svg` | いちご。さきが とがった みに たねの 点、上に みどりの がく | cream red | — | PrefScene / StoryScene / いちご / いちご(しゅうかく中) ほか1 |
| `sweet.svg` | わがし。まるい もちの 中に あんこが 見える。cake(ようがし)とは 見わける | amber brown cream dark deepgreen gray lime orange tan | — | くりの きんとん / くろざとう / こんにゃく / さつまいもの かりんとう ほか6 |
| `tealeaf.svg` | ちゃば。ひしがた 3つでは「はっぱ」に 見えなかったので さきの とがった はっぱ+まんなかの すじ に する | deepgreen green lime | — | ちゃば / ちゃば(しゅうかく中) / にしおの まっちゃ / みやざきの ちゃ |
| `tree.svg` | き。太い みきと まるい はっぱの かたまり。forest(すぎ 3本)や palm(やしのき)とは べつ | deepgreen | 20〜22 | PrefScene / onbashiraGame / yamayakiGame / よしのすぎ ほか1 |
| `tuber.svg` | いも(さつまいも・じゃがいも)。ながい たまごがたに 土の 点 | amber brown dark purple tan violet | — | こんにゃくいも / さつまいも / さといも / じゃがいも ほか2 |

## ひと・いきもの(36)

| ファイル | 何を 描くか | つかう いろ | 出る 大きさ(px) | どこで つかう |
|---|---|---|---|---|
| `ant.svg` | はち(はなの みつ・しましま) */ bee: (g) => { line(g, EYE, 2); g.beginPath(); g.moveTo(13, 30); g.lineTo(9, 20); g.strokePath(); g.beginPath(); g.moveTo(20, 29); g.lineTo(20, 18); g.strokePath(); fill(g, EYE); g.fillCircle(9, 19, 2.4); g.fillCircle(20, 17, 2.4); g.fillStyle(WHITE, 0.85); g.fillEllipse(31, 28, 24, 15); g.fillEllipse(47, 30, 18, 12); line(g, 0x9aa0a6, 1.8); g.strokeEllipse(31, 28, 24, 15); g.strokeEllipse(47, 30, 18, 12); fill(g, EYE); g.fillTriangle(57, 40, 62, 45, 55, 47); fill(g, 0xf5d84e); g.fillCircle(30, 40, 12); g.fillCircle(51, 42, 8.5); line(g, 0xc2a52c, 2.2); g.strokeCircle(30, 40, 12); g.strokeCircle(51, 42, 8.5); fill(g, 0x3c3c44); g.fillCircle(42, 41, 10.5); g.fillCircle(16, 37, 9.5); fill(g, WHITE); g.fillCircle(13, 35, 2.8); g.fillCircle(20, 35, 2.8); }, /** あり(はたらく むし・3つの まる) | dark | — | らっかせい(しゅうかく中) |
| `bird.svg` | たんけんヒヨコ ぴっけ(このゲームの マスコット) */ chick: (g) => { const Y = 0xf7d24a; const YD = 0xc79c22; fill(g, Y); for (const [x, y] of [ [26, 13], [32, 9], [38, 13], ] as const) g.fillEllipse(x, y, 9, 11); line(g, YD, 2); for (const [x, y] of [ [26, 13], [32, 9], [38, 13], ] as const) g.strokeEllipse(x, y, 9, 11); fill(g, BEAK); g.fillRoundedRect(21, 49, 8, 11, 3); g.fillRoundedRect(35, 49, 8, 11, 3); line(g, BEAK_D, 1.8); g.strokeRoundedRect(21, 49, 8, 11, 3); g.strokeRoundedRect(35, 49, 8, 11, 3); fill(g, Y); g.fillCircle(32, 33, 19); line(g, YD, 2.6); g.strokeCircle(32, 33, 19); fill(g, CHEEK); g.fillCircle(21, 39, 3.4); g.fillCircle(43, 39, 3.4); fill(g, Y); g.fillEllipse(13, 41, 12, 17); g.fillEllipse(51, 41, 12, 17); line(g, YD, 2.2); g.strokeEllipse(13, 41, 12, 17); g.strokeEllipse(51, 41, 12, 17); fill(g, EYE); g.fillCircle(25, 30, 3.4); g.fillCircle(39, 30, 3.4); shine(g, 24, 29, 1.3, 1.3); shine(g, 38, 29, 1.3, 1.3); fill(g, BEAK); g.beginPath(); g.moveTo(32, 36); g.lineTo(25, 40); g.lineTo(32, 46); g.lineTo(39, 40); g.closePath(); g.fillPath(); line(g, BEAK_D, 2); g.strokePath(); }, /** たまごから でる ヒヨコ(あたらしく はじまる しるし) */ 'chick-egg': (g) => { const Y = 0xf7d24a; const YD = 0xc79c22; fill(g, Y); g.fillEllipse(32, 25, 30, 15); g.fillCircle(32, 25, 14); line(g, YD, 2.4); g.strokeCircle(32, 25, 14); fill(g, EYE); g.fillCircle(27, 22, 2.8); g.fillCircle(37, 22, 2.8); fill(g, BEAK); g.fillTriangle(32, 27, 27, 31, 37, 31); fill(g, CREAM); g.beginPath(); g.moveTo(12, 42); g.lineTo(18, 34); g.lineTo(24, 41); g.lineTo(31, 33); g.lineTo(38, 41); g.lineTo(45, 34); g.lineTo(52, 42); g.lineTo(48, 54); g.lineTo(38, 60); g.lineTo(26, 60); g.lineTo(16, 54); g.closePath(); g.fillPath(); line(g, CREAM_D, 2.4); g.strokePath(); fill(g, CREAM); g.beginPath(); g.moveTo(20, 12); g.lineTo(28, 4); g.lineTo(36, 4); g.lineTo(44, 12); g.lineTo(38, 10); g.lineTo(32, 15); g.lineTo(26, 10); g.closePath(); g.fillPath(); line(g, CREAM_D, 2); g.strokePath(); }, /** とり(そらを とぶ とり・やちょう) | sky teal | 24〜24 | mikoshiGame / reapGame / いちご(しゅうかく中) / いわくにれんこん(しゅうかく中) ほか22 |
| `boar.svg` | いのしし(やまの けもの・きばと せの けが とくちょう) | brown | — | かぼちゃ(しゅうかく中) / くり(しゅうかく中) / こんにゃくいも(しゅうかく中) / さつまいも(しゅうかく中) ほか4 |
| `bug.svg` | いもむし(はっぱの むし・そざいの じゃま) | green lime | — | あい(しゅうかく中) / うめ(しゅうかく中) / えだまめ(しゅうかく中) / かつおな(しゅうかく中) ほか30 |
| `crowd.svg` | ひとだかり(にんき・おきゃくさんが たくさん) | teal | — | fukuotokoGame |
| `deer.svg` | しか(なら・やまの けもの・つのが とくちょう) | brown | 30〜30 | yamayakiGame / エリア きんき |
| `dragon.svg` | りゅう(ねぶた・たつの おまつり) | gold green red | 44〜44 | kaguraGame / いわみかぐら / ながさきくんち |
| `duck.svg` | かも(みずべの とり・ひらたい くちばし) | brown | — | しじみ(しゅうかく中) / のり(しゅうかく中) |
| `face-angry.svg` | おこった かお(だめ・きけんの しるし) | cream | — | kazariumaGame |
| `face-sad.svg` | かなしい かお(ざんねん・もういちど) | cream | — | festivalGame / fukuotokoGame |
| `face-smile.svg` | にこにこの かお(せいこう・ごうかくの しるし) | cream | 20〜20 | betchaGame / festivalGame / karakuriGame / yukakeGame |
| `face-surprised.svg` | びっくりの かお(はっけん・おどろき) | cream | — | hyottokoGame / karakuriGame |
| `foot.svg` | あしうら(あるく・すすむ) | gray tan | 40〜40 | awaodoriGame / warajiGame |
| `foxmask.svg` | きつねの おめん(いなり・おまつりの おめん) | orange | — | festivalGame / hyottokoGame |
| `frog.svg` | かえる(たんぼの いきもの・じゃまする やつ) | green | 32〜32 | reapGame |
| `hand.svg` | てのひら(タップ・さわる あんない) | cream tan | 40〜40 | kantouGame / minyouGame |
| `hand-clap.svg` | ぱちぱち(はくしゅ・おいわい) | tan | — | awaodoriGame / minyouGame |
| `hawk.svg` | たか(はねを ひろげた もうきん・そらの おうさま) | brown | — | いかなご(しゅうかく中) / かき(しゅうかく中) / さくらえび(しゅうかく中) / しらす(しゅうかく中) ほか3 |
| `horse.svg` | うま(やぶさめ・のうぎょうの うま) | brown | 48〜48 | kazariumaGame / ふじさきはちまんぐうの あきまつり |
| `mask.svg` | 意味が きまっている いろ(ひとの はだ・目・しろ・き) */ const SKIN = 0xf2c9a0; const EYE = 0x2c2c33; const WHITE = 0xfaf6ec; const CREAM = 0xf6e7c4; const CREAM_D = 0xc0a878; const WOOD = 0x8a6a4a; const BEAK = 0xf0913c; const BEAK_D = 0xbc6a22; const CHEEK = 0xf28ba0; const WATER = 0x76c4e8; /** はだ色の あたま(ふちは こい色) */ const head = (g: G, c: [number, number], x: number, y: number, r: number): void => { fill(g, SKIN); g.fillCircle(x, y, r); line(g, c[1]); g.strokeCircle(x, y, r); }; /** ちいさな くろい 目 2つ */ const dotEyes = (g: G, x: number, y: number, gap: number, r = 2): void => { fill(g, EYE); g.fillCircle(x - gap, y, r); g.fillCircle(x + gap, y, r); }; /** まるい 目 2つ(しろ目 + くろ目) */ const bigEyes = (g: G, c: [number, number], x: number, y: number, gap: number, r: number): void => { fill(g, WHITE); g.fillCircle(x - gap, y, r); g.fillCircle(x + gap, y, r); line(g, c[1], 2); g.strokeCircle(x - gap, y, r); g.strokeCircle(x + gap, y, r); fill(g, EYE); g.fillCircle(x - gap, y, r * 0.5); g.fillCircle(x + gap, y, r * 0.5); }; /** てんを つないだ かたち(ぬり + ふちどり) */ const poly = (g: G, c: [number, number], pts: readonly (readonly [number, number])[], w = 2.4): void => { fill(g, c[0]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillPath(); line(g, c[1], w); g.strokePath(); }; /** ふく(からだ)を まるみの ある だいけいで 描く */ const torso = (g: G, c: [number, number], cx: number, top: number, wTop: number, bottom: number, wBot: number): void => { fill(g, c[0]); g.beginPath(); g.moveTo(cx - wTop / 2, top); g.lineTo(cx + wTop / 2, top); g.lineTo(cx + wBot / 2, bottom); g.lineTo(cx - wBot / 2, bottom); g.closePath(); g.fillPath(); line(g, c[1]); g.strokePath(); }; /** あし 2ほん(こい色) */ const legs2 = (g: G, c: [number, number], cx: number, y: number, h: number): void => { fill(g, c[1]); g.fillRoundedRect(cx - 9, y, 8, h, 4); g.fillRoundedRect(cx + 1, y, 8, h, 4); }; /** ほそい あし(とりの あし) */ const birdLegs = (g: G, x: number, y: number): void => { line(g, BEAK_D, 2.4); for (const dx of [-5, 5]) { g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x + dx, y + 7); g.lineTo(x + dx + 4, y + 9); g.strokePath(); } }; export const ACTOR_ICONS: Record<string, IconDraw> = { /** おめんの かたち(おまつり・やたいの おめん) | cream red violet | 80〜80 | hyottokoGame / kabukiGame / たかさき だるまいち / ひゅうが ひょっとこ なつまつり |
| `oni.svg` | おに(せつぶん・おにの おまつり) | brown crimson | 46〜58 | betchaGame / nebutaGame / うわじま うしおにまつり / おのみち べっちゃーまつり |
| `owl.svg` | ふくろう(よるの とり・おおきな目) | brown | 84〜84 | StoryScene |
| `person.svg` | ふつうの ひと(むらびと・だれか) | gray navy pink teal | 18〜46 | awaodoriGame / chousaGame / crowd / danjiriGame ほか16 |
| `person-carry.svg` | ぼうを かつぐ ひと(にもつ・おこめを はこぶ) | white | — | はかた ぎおん やまかさ |
| `person-child.svg` | こども(あたま 大きめ・せは ひくい) | amber pink sky | 18〜32 | betchaGame / crowd / festivalGame / kokkodeshoGame ほか4 |
| `person-dancer.svg` | おどる ひと(ぼんおどり・おまつりの おどり) | amber crimson pink teal violet | 34〜34 | karakuriGame / yosakoiGame / あわおどり / にいがた まつり |
| `person-kimono.svg` | きものの ひと(おまつり・ぶんかの ばめん) | crimson navy violet | 26〜58 | awaodoriGame / crowd / dashiGame / gionGame ほか9 |
| `person-runner.svg` | はしる ひと(かけっこ・いそぐ ばめん) | sky white | 44〜44 | fukuotokoGame / にしのみやの とおかえびす |
| `person-worker.svg` | はたらく ひと(のうか・しょくにん。はちまきと まえかけ) | red sky tan | 30〜36 | ougiGame / rhythmGame / shellGame |
| `rabbit.svg` | うさぎ(つきみ・ながい みみ) | white | — | ゆきしたにんじん(しゅうかく中) |
| `shark.svg` | さめ(うみの きけんな さかな・おおきな せびれ) | gray | — | いせえび(しゅうかく中) |
| `snail.svg` | かたつむり(あめの いきもの・ゆっくり) | tan | — | きのこ(しゅうかく中) / わさび(しゅうかく中) |
| `sparrow.svg` | すずめ(ちいさな とり・むらの とり) | — | — | — |
| `squirrel.svg` | りす(どんぐり・ふさふさの しっぽ) | tan | — | ブルーベリー(しゅうかく中) |
| `tengu.svg` | てんぐ(やまの ぶんか・あかい かおと ながい はな) | red | 28〜28 | dashiGame |
| `whale.svg` | くじら(うみの おおきな いきもの・しおふき) | blue | — | fishGame |

## しぜん・けしき(28)

| ファイル | 何を 描くか | つかう いろ | 出る 大きさ(px) | どこで つかう |
|---|---|---|---|---|
| `cloud.svg` | くも(そらの もよう・もやもやぐも) | — | — | — |
| `cloud-dark.svg` | こい もやもやぐも(じゃまを する わるい くも) | gray | — | StoryScene |
| `clover.svg` | クローバー(まきば・くさち・しあわせ) | — | — | — |
| `field.svg` | はたけの うね(たがやす・そざいを そだてる) | brown | — | PrefScene |
| `fire.svg` | てんを つないだ かたちを ぬって、こい色で ふちどる */ const poly = (g: G, pts: readonly [number, number][], c: [number, number], w = 2.4): void => { fill(g, c[0]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) g.lineTo(x, y); g.closePath(); g.fillPath(); line(g, c[1], w); g.strokePath(); }; /** ふちどり つきの ふとい すじ(なみ・かぜ・ゆげ に つかう) */ const band = (g: G, pts: readonly [number, number][], c: [number, number], w = 4.5): void => { const trace = (): void => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) g.lineTo(x, y); g.strokePath(); }; line(g, c[1], w + 2.4); trace(); line(g, c[0], w); trace(); }; /** 4つの とがりの きらり */ const twinkle = (g: G, x: number, y: number, r: number, c: [number, number]): void => { const pts: [number, number][] = []; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI * 2; const rr = i % 2 === 0 ? r : r * 0.3; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(g, pts, c, r > 12 ? 2.2 : 1.6); }; /** 5つの とがりの ほし */ const star5 = (g: G, x: number, y: number, r: number, c: [number, number]): void => { const pts: [number, number][] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; const rr = i % 2 === 0 ? r : r * 0.42; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(g, pts, c, r > 12 ? 2.4 : 1.6); }; /** みずの しずく(はねた みず に つかう) */ const drop = (g: G, x: number, y: number, r: number, c: [number, number]): void => { line(g, c[1], 2.2); g.strokeCircle(x, y, r); g.strokeTriangle(x - r * 0.9, y - r * 0.4, x + r * 0.9, y - r * 0.4, x, y - r * 2.7); fill(g, c[0]); g.fillCircle(x, y, r); g.fillTriangle(x - r * 0.95, y - r * 0.45, x + r * 0.95, y - r * 0.45, x, y - r * 2.6); }; /** ぐもの もこもこ(cloud / cloud-dark で つかう)。ふちを 先に 太く ひいて 上から ぬる */ const cloudBody = (g: G, y: number, body: number, edge: number): void => { const lumps: [number, number, number][] = [ [21, y + 2, 12], [33, y - 4, 15], [46, y + 3, 11], [16, y + 13, 8.5], [34, y + 14, 10], [49, y + 12, 7.5], ]; line(g, edge, 5.4); for (const [x, cy, r] of lumps) g.strokeCircle(x, cy, r); g.strokeRoundedRect(9, y + 2, 46, 15, 7.5); fill(g, body); for (const [x, cy, r] of lumps) g.fillCircle(x, cy, r); g.fillRoundedRect(9, y + 2, 46, 15, 7.5); }; export const NATURE_ICONS: Record<string, IconDraw> = { /** ほのお(かまど・やきもの・はなび の たね火) | orange | 14〜40 | balloonGame / himatsuriGame / ougiGame / rokuroGame ほか3 |
| `forest.svg` | もり(すぎの き 3本。しんりん・きこり) | — | — | — |
| `gem.svg` | すいしょう(たからもの・ほうせき) | sky violet | — | すいしょう / すいしょうざいく |
| `hibiscus.svg` | ハイビスカス(おきなわ・あたたかい みなみの はな) | pink | 26〜26 | tsunahikiGame / エリア きゅうしゅう・おきなわ |
| `hill.svg` | なだらかな おか(のはら・けしき) | — | — | — |
| `hotspring.svg` | おんせん(お湯の うつわと ゆげ 3本) | sky | 30〜30 | yukakeGame / べっぷ おんせんまつり |
| `leaf.svg` | はっぱ(みどり・しょくぶつ・おちゃ) | lime navy | — | PrefScene / あい / あい(しゅうかく中) |
| `log.svg` | まるた・ほだぎ(きのこ さいばい・きを きる) | brown cream dark tan | 34〜34 | catchGame / eyouGame / こうぞ / こうぞ(しゅうかく中) ほか3 |
| `moon.svg` | つき(よる・ねむる じかん) | — | — | — |
| `mountain.svg` | やま(ゆきがしらの ふじさん風。けしき・りっち) | gray sky | — | PrefScene / すいしょう(えんしゅつ1) / てついし(えんしゅつ1) / ねんど(えんしゅつ1) ほか2 |
| `palm.svg` | やしのき(おきなわ・あたたかい みなみの しま) | deepgreen | 34〜34 | tsunahikiGame |
| `rock.svg` | いわ(てついし・こうぶつを ほる) | gray | — | fukuotokoGame |
| `sakura.svg` | さくら(はなみ・はる) | pink | 16〜40 | PrefScene / hanagasaGame |
| `snow.svg` | ふる ゆき(ゆきの ひ・つもった ゆき) | — | — | — |
| `snowflake.svg` | ゆきの けっしょう(ゆき・さむさの しるし) | sky | — | エリア ほっかいどう・とうほく |
| `snowman.svg` | ゆきだるま(ゆきの おまつり・ふゆの けしき) | white | — | yukimatsuriGame / さっぽろ ゆきまつり |
| `sparkle.svg` | きらきら(できばえ・ごほうびの えんしゅつ) | amber gold pink | 18〜58 | FestivalScene / MapScene / StoryScene / effects ほか9 |
| `splash.svg` | はねた みず(みずやり・しぶき) | sky | 26〜26 | kazariumaGame / yukakeGame |
| `star-night.svg` | よぞらの ほし(よるの けしき・ほしまつり) | — | — | — |
| `sun.svg` | おひさま(はれの ひ・あさ) | gold | 26〜26 | PrefScene |
| `tulip.svg` | チューリップ(はなだん・はなの さいばい) | green pink red | — | チューリップ / チューリップ(しゅうかく中) / チューリップ(まだ はやい) / チューリップの はなたば |
| `volcano.svg` | けむりを 上げる やま(さくらじま・かざん) | — | — | — |
| `wave.svg` | うみの なみ(3すじの 波がしら) | sky teal | — | PrefScene / あじ(えんしゅつ2) / あなご(えんしゅつ2) / あゆ(えんしゅつ2) ほか14 |
| `wind.svg` | かぜ(うずまきと ながれる すじ) | teal | — | いぐさ(しゅうかく中) / うど(しゅうかく中) / きにら(しゅうかく中) / さとうきび(しゅうかく中) ほか7 |

## どうぐ・おまつりの もの(37)

| ファイル | 何を 描くか | つかう いろ | 出る 大きさ(px) | どこで つかう |
|---|---|---|---|---|
| `balloon.svg` | ねつききゅう。まるい ふくらみと したの かご | red | 22〜54 | balloonGame / さが バルーンフェスタ |
| `banner.svg` | のぼりばた(おまつりの はた) | pink | — | せんだい たなばたまつり |
| `basket.svg` | かご(しゅうかくを いれる たけかご) | tan | 28〜32 | rhythmGame / shellGame |
| `bell.svg` | かね(いしどり・しゃんしゃん傘の すず) | gold | — | ishidoriGame |
| `boat.svg` | ふね。よこから 見た 船体と ほばしら 1本。rowboat(こぶね)・raft(いかだ)とは 見わける | cream navy white | 28〜28 | PrefScene / scoopGame / あじ(えんしゅつ1) / あなご(えんしゅつ1) ほか11 |
| `bucket.svg` | おけ(みずくみ・しゅうかくの いれもの) | silver | — | うなぎ(えんしゅつ1) |
| `cage.svg` | かにかご(あみを はった しかけかご) | — | — | — |
| `cart.svg` | 山車(だんじり。くるまの ついた おまつりの やたい) | brown cream crimson dark gold red | — | かわごえまつり / きしわだ だんじりまつり / ぎおんまつり / くわなの いしどりまつり ほか2 |
| `castle.svg` | てんしゅかく(おしろ) | cream | 34〜34 | yamayakiGame |
| `drum.svg` | てんを つないだ かたちを ぬって、こい色で ふちどる */ const poly = (g: G, pts: readonly [number, number][], c: [number, number], w = 2.4): void => { fill(g, c[0]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) g.lineTo(x, y); g.closePath(); g.fillPath(); line(g, c[1], w); g.strokePath(); }; /** かどの まるい しかく(いた・はこ・ぼう に つかう) */ const box = (g: G, x: number, y: number, w: number, h: number, r: number, c: [number, number], lw = 2.4): void => { fill(g, c[0]); g.fillRoundedRect(x, y, w, h, r); line(g, c[1], lw); g.strokeRoundedRect(x, y, w, h, r); }; /** ふとい ぼう(えだ・え・はしら)。ふちを 先に ひいて 上から ぬる */ const rod = (g: G, x1: number, y1: number, x2: number, y2: number, c: [number, number] = [WOOD, WOOD_D], w = 4): void => { const trace = (): void => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath(); }; line(g, c[1], w + 2.6); trace(); line(g, c[0], w); trace(); }; /** 下むきの はんえん(はち・ドーム) */ const dome = (g: G, x: number, y: number, r: number, c: [number, number], up = true): void => { const a0 = up ? Math.PI : 0; const a1 = up ? Math.PI * 2 : Math.PI; fill(g, c[0]); g.slice(x, y, r, a0, a1, false); g.fillPath(); line(g, c[1]); g.beginPath(); g.arc(x, y, r, a0, a1, false); g.closePath(); g.strokePath(); }; /** ひ(たいまつ・かま の ほのお) */ const flame = (g: G, x: number, y: number, s: number): void => { poly( g, [ [x, y - s * 1.9], [x + s * 0.85, y - s * 0.5], [x + s * 0.7, y + s * 0.7], [x - s * 0.7, y + s * 0.7], [x - s * 0.85, y - s * 0.5], ], [FLAME, 0xbc6a22], 2, ); poly( g, [ [x, y - s * 0.9], [x + s * 0.45, y], [x + s * 0.35, y + s * 0.7], [x - s * 0.35, y + s * 0.7], [x - s * 0.45, y], ], [FLAME_IN, 0xe0a52c], 1.4, ); }; /** やねの かたち(そりかえった のき)。castle / cart で つかう */ const roofShape = (g: G, cx: number, yTop: number, yBot: number, halfTop: number, halfBot: number, c: [number, number]): void => { poly( g, [ [cx - halfTop, yTop], [cx + halfTop, yTop], [cx + halfBot, yBot - 4], [cx + halfBot - 2.5, yBot], [cx - halfBot + 2.5, yBot], [cx - halfBot, yBot - 4], ], c, ); }; export const PROP_ICONS: Record<string, IconDraw> = { lantern: (g, c) => { fill(g, 0x8a6a4a); g.fillRect(28, 6, 8, 6); fill(g, c[0]); g.fillEllipse(32, 34, 32, 44); line(g, c[1]); g.strokeEllipse(32, 34, 32, 44); fill(g, 0xf5d84e); g.fillEllipse(32, 34, 16, 26); fill(g, 0x8a6a4a); g.fillRect(22, 10, 20, 5); g.fillRect(22, 54, 20, 5); }, fan: (g, c) => { fill(g, c[0]); g.slice(32, 52, 30, Math.PI * 1.15, Math.PI * 1.85, false); g.fillPath(); line(g, c[1]); g.beginPath(); g.arc(32, 52, 30, Math.PI * 1.15, Math.PI * 1.85, false); g.strokePath(); line(g, c[1], 1.4); for (let i = 0; i <= 4; i++) { const a = Math.PI * 1.15 + (i / 4) * Math.PI * 0.7; g.beginPath(); g.moveTo(32, 52); g.lineTo(32 + Math.cos(a) * 30, 52 + Math.sin(a) * 30); g.strokePath(); } fill(g, 0x8a6a4a); g.fillCircle(32, 52, 4); }, /** たいこ。ほかと 大きさを そろえ、びょうを うって「バケツ」に 見えない ように する | brown crimson gold | 30〜34 | awaodoriGame / chousaGame / hyottokoGame / ishidoriGame ほか5 |
| `flute.svg` | よこぶえ(おはやしの ふえ) | tan | — | hyottokoGame |
| `glove.svg` | てぶくろ(はたけしごとの ぐんて) | white | — | さぬきの てぶくろ |
| `horn.svg` | ほらがい(みなとの あいずの つのぶえ) | gold | — | sousenGame |
| `house.svg` | まちや(むらの いえ) | teal | 40〜40 | ushioniGame |
| `hut.svg` | こや(かやぶきの ちいさな こや) | brown | — | わぎゅう(たてもの) |
| `kiln.svg` | かま(やきものを やく かま) | brown | — | びんちょうたん(たてもの) |
| `kite.svg` | たこ(あげる たこ)。ひしがたの 本体と しっぽ 2本、いと | sky | 20〜20 | takoGame / はままつまつり |
| `knife.svg` | ほうちょう(りょうりの どうぐ) | silver | 40〜40 | kaguraGame / たたらの ほうちょう |
| `ladle.svg` | ひしゃく(みずを くむ たけの どうぐ) | tan | 34〜34 | yukakeGame |
| `naruko.svg` | よさこいの なるこ(木の いたを うちならす どうぐ) | red | 46〜46 | yosakoiGame / よさこいまつり |
| `net.svg` | あみ(さかなを すくう たまあみ) | — | — | — |
| `pick.svg` | つるはし(こうざん・かいたくの どうぐ) | silver | — | すいしょう(えんしゅつ2) / てついし(えんしゅつ2) / ねんど(えんしゅつ2) / チタン(えんしゅつ2) |
| `raft.svg` | いかだ(まるたを ならべた ふね) | tan | — | むつごろう(えんしゅつ1) |
| `rope.svg` | つな・なわ。まえは ななめの すじだけで なにか わからなかったので たばねた 「わ」+ よじれ に する(おおづなひき・わらじ・かんぴょう) | cream crimson tan | — | かんぴょう / なは おおづなひき / ふくしま わらじまつり |
| `rowboat.svg` | てこぎの こぶね(かわくだり・ふなあそび) | brown | — | ふな(えんしゅつ1) / ままかり(えんしゅつ1) |
| `sake.svg` | さけ(とっくりと おちょこ) | cream | — | あまざけ |
| `saw.svg` | のこぎり(きを きる どうぐ) | — | — | — |
| `scroll.svg` | まきもの(ずかん・いいつたえ) | cream | — | みのわし |
| `shamisen.svg` | しゃみせん(かぶきの おはやし) | tan | — | kabukiGame |
| `shrine.svg` | とりい。2本の はしらと 上の よこぎ 2本 | gold red | 34〜40 | eyouGame / kazariumaGame / yamakasaGame / かんだまつり ほか1 |
| `stall.svg` | おまつりの やたい(しま模様の やね+だい) | brown | — | ましこ とうきいち |
| `tassel.svg` | ふさ(つなひきの つなの まんなかの かざり) | crimson | 34〜34 | tsunahikiGame |
| `torch.svg` | たいまつ(よまつりの ひ) | orange | — | よしだの ひまつり |
| `towel.svg` | てぬぐい(ものほしに かけた ぬの) | white | — | いまばりの タオル |
| `tower.svg` | てっとう(とうきょうタワー風の たかい とう) | red | — | エリア かんとう |
| `umbrella.svg` | わがさ(かさおどりの かさ) | pink | — | とっとり しゃんしゃんまつり |
| `well.svg` | いど(石の わく+つるべ) | gray sky | — | PrefScene / みず(たてもの) |

## きごう(UI)(31)

| ファイル | 何を 描くか | つかう いろ | 出る 大きさ(px) | どこで つかう |
|---|---|---|---|---|
| `arrow-down.svg` | ↓(したへ・ダウンロード) | navy | 24〜24 | kaguraGame / yamakasaGame |
| `arrow-left.svg` | ←(まえに もどる) | navy | — | kaguraGame |
| `arrow-right.svg` | →(つぎへ すすむ) | navy | — | kaguraGame |
| `arrow-up.svg` | ↑(うえへ・ランクアップ) | navy | — | kaguraGame |
| `bag.svg` | リュック(もちもの) | brown gray | — | nav |
| `book.svg` | ひらいた 本(ずかん) | blue gray teal | 56〜56 | StoryScene / nav |
| `bulb.svg` | でんきゅう(ひらめき・ヒント) | — | — | — |
| `check.svg` | ✓(せいかい・できた) | — | — | — |
| `cross.svg` | ✕(ちがう・とじる) | gray | 24〜24 | widgets |
| `crown.svg` | かんむり(いちばんの ごほうび) | — | — | — |
| `doc.svg` | しょるい(きろく・レシピの かみ) | — | — | — |
| `flag.svg` | はた(もくひょう・ゴール) | crimson red | 18〜26 | chousaGame / sousenGame |
| `gear.svg` | はぐるま(せってい) | gray | — | nav |
| `heart.svg` | ハート(すき・げんき) | white | 20〜20 | kaniGame |
| `lock.svg` | かぎが かかっている(まだ ひらけない) | — | — | — |
| `medal.svg` | メダル(ごほうび) | — | — | — |
| `minus.svg` | −(へらす) | — | — | — |
| `note.svg` | おんぷ(おと・BGM) | purple | 26〜26 | kazariumaGame |
| `pin.svg` | ピン(ちずの ばしょ) | gray red | — | nav |
| `plus.svg` | +(ふやす・くわえる) | — | — | — |
| `question.svg` | ?(まだ わからない・ひみつ) | gray | — | InvScene / PrefScene / ZukanScene |
| `sound-off.svg` | おとを けす(スピーカー+×) | gray | — | nav |
| `sound-on.svg` | おとが なる(スピーカー+おとの なみ) | navy | — | nav |
| `spin-left.svg` | ↺(ひだりに まわす) | gold | — | hanagasaGame |
| `spin-right.svg` | ↻(みぎに まわす。はながさ回しの あいず) | gold | 46〜46 | hanagasaGame |
| `star.svg` | てんを つないだ かたちを ぬって、こい色で ふちどる */ const poly = (g: G, pts: readonly Pt[], c: [number, number], w = 2.6): void => { fill(g, c[0]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) g.lineTo(x, y); g.closePath(); g.fillPath(); line(g, c[1], w); g.strokePath(); }; /** かどの まるい しかく(ぼう・いた・はこ) */ const box = (g: G, x: number, y: number, w: number, h: number, r: number, c: [number, number], lw = 2.6): void => { fill(g, c[0]); g.fillRoundedRect(x, y, w, h, r); line(g, c[1], lw); g.strokeRoundedRect(x, y, w, h, r); }; /** ふとい 線(こい色の したじき+ほんたい色の うわぬり)で 道すじを 2どがき する */ const stroke2 = (g: G, c: [number, number], w: number, trace: () => void): void => { line(g, c[1], w + 3); trace(); line(g, c[0], w); trace(); }; /** てんを (cx,cy) のまわりに deg どだけ まわす */ const turn = (pts: readonly Pt[], deg: number, cx = 32, cy = 32): Pt[] => { const r = (deg * Math.PI) / 180; const co = Math.cos(r); const si = Math.sin(r); return pts.map(([x, y]) => [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co] as Pt); }; /** ほしの とがり(ro=そとがわ半径, ri=うちがわ半径) */ const starPts = (cx: number, cy: number, ro: number, ri: number): Pt[] => { const pts: Pt[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; const r = i % 2 === 0 ? ro : ri; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return pts; }; /** じゅうじ(+)の 12かくけい。deg=45 で ×に なる */ const crossPts = (cx: number, cy: number, len: number, t: number, deg: number): Pt[] => turn( [ [cx - t, cy - len], [cx + t, cy - len], [cx + t, cy - t], [cx + len, cy - t], [cx + len, cy + t], [cx + t, cy + t], [cx + t, cy + len], [cx - t, cy + len], [cx - t, cy + t], [cx - len, cy + t], [cx - len, cy - t], [cx - t, cy - t], ], deg, cx, cy, ); /** みぎむきの やじるし(太い みじかい 矢)。turn で 4ほうこうに つかう */ const ARROW: readonly Pt[] = [ [9, 25], [30, 25], [30, 11], [57, 32], [30, 53], [30, 39], [9, 39], ]; /** かぎの ほんたい(lock / unlock で つかう) */ const lockBody = (g: G, c: [number, number]): void => { box(g, 12, 28, 40, 30, 8, c); fill(g, c[1]); g.fillCircle(32, 40, 5); g.fillTriangle(28.6, 41, 35.4, 41, 32, 52); }; /** スピーカー(sound-on / sound-off で つかう) */ const speaker = (g: G, c: [number, number], dx = 0): void => { poly(g, [ [8 + dx, 25], [21 + dx, 25], [35 + dx, 11], [35 + dx, 53], [21 + dx, 39], [8 + dx, 39], ], c); }; export const UI_ICONS: Record<string, IconDraw> = { /** ★(できばえの ほし。ついた ぶん) | gold | — | InvScene / PrefScene / ZukanScene / effects ほか2 |
| `star-empty.svg` | ☆(まだ ついていない ほし。star と ならべて ★★☆ に する) | tan | — | widgets |
| `target.svg` | まるい 的(ねらい・もくひょう) | red teal | 22〜32 | balloonGame |
| `trash.svg` | ごみばこ(けす・すてる) | — | — | — |
| `trophy.svg` | トロフィー(ゆうしょうカップ) | — | — | — |
| `unlock.svg` | かぎが ひらいた(あそべる ように なった) | — | — | — |

## せかい(ミニゲームの 背景・小道具)

いまは コードで しかくと まるを ならべて 描いています。
1本ずつ 「その まつり・その しごとの 場所」に 見える 背景が ほしい。
画面は たて480×748(アイコンと おなじ 座標系)。人物や 道具は アイコンで のせるので、
**背景は 場所だけ**を 描く(人・道具は 描きこまない)。

| ファイル | ゲーム | どんな 場所か(コードの せつめいより) | いまの 色 |
|---|---|---|---|
| `bg-awaodori.svg` | awaodori | あわおどり(とくしま): 「ぞめき」の 2びょうしで まちを ながれる おどり。 ふりの きごうが ながれてくるので、きごうに よって うごきを うちわける。 👏(て) = タップ 🦶(あし) = 上に スワイプ おなじ きごうが つづくと リズムに のって「ぞめき タイム」= 得点2ばい。 まちがえた うごきでも | 0x2f2a4a 0xffd34d 0x4a3a2a 0xffffff |
| `bg-balloon.svg` | balloon | さが インターナショナル バルーンフェスタ: あさの しずかな そらに 100きいじょうの ききゅうが あがる。 ききゅうは まえに すすむ ハンドルが ない ― 「たかさ」を かえて、そこに ふいている かぜに のる。 これは じっさいの きょうぎ(ちじょうの もくひょうに どれだけ ちかづけるか)を そのまま あそ | 0x9fd8f5 0xffffff 0x8fbf6a |
| `bg-betcha.svg` | betcha | おのみち べっちゃーまつり(ひろしま): おにが「ささら」や「しゅくぼう」で こどもを つくと 1ねん びょうきを しないと いわれる まつり。 プレイヤーは おに(ベタ)を うごかして、にげまわる こどもを つかまえる(タップ)。 こどもは ちかづくと はやく にげるので、さきを よんで タップする。 ぜんぶ つかま | 0xbfe4f5 0x9ec9d8 0xd8c8a8 0x8a6a4a 0xc0392b |
| `bg-catch.svg` | catch | キャッチゲーム(うめ・なし・みかん): 木から実が降ってくる→かごを左右にドラッグしてキャッチ。 金の実はボーナス、枝はハズレ(コンボが切れる)。時間経過で落下が速く・多くなる。 かごは指へ吸い付くように追従しつつ慣性で傾く(手応えレイヤー) | 0x8a6242 0x5e9c43 0x7bbf5a |
| `bg-chain.svg` | chain | 色づき収穫(いちご・だいず): 畑の実が 緑 → だんだん色づく → 食べごろ → しおれる と変化していく。「食べごろ」の実だけを素早く摘む。青いうちに触るとコンボが切れる。 同じ形の実を色で見分けるのが本体(時間経過で食べごろの窓が短くなる) | 0xa8895c 0x5e9c43 0x7bbf5a |
| `bg-chousa.svg` | chousa | さぬき ちょうさまつり(かがわ): おおきな たいこだいを 4すみの かたで かつぎ上げる。 4つの「かた」の ちからゲージが バラバラに さがるので、さがった かたを タップして ちからを もどす ― ぜんぶ たかいまま そろえると「さしあげ」ができて 大とくてん。 1つでも 0に なると たいこだいが かたむいて  | 0x9ec9e8 0xd8c69a 0xc0392b 0xe05b5b 0xc9a23f 0xffffff |
| `bg-danjiri.svg` | danjiri | きしわだ だんじりまつり(おおさか): 「やりまわし」。 だんじりは とまらない。はしりながら かどを 直角に まわす ― だから これは 「はしる → かどの ちょうどで タップ」の いっしゅんの はんだんゲーム。 ゲージの ひかる ゾーンで タップすると きれいに まがる。 はやすぎ・おそすぎでも だんじりは たお | 0xbfe4f5 0x9e9e8a 0xd8d8c4 0x7a6a4a 0x8a7a5a 0x6b4a2a |
| `bg-daruma.svg` | daruma | だるまいち(ぐんま・たかさき): ゆらゆら動くだるまをタップで落とし、 タイミングよく まんなかに つみあげるバランスゲーム。 ずれても倒れない(成功保証)— 大きくずれた だるまは ころんと転がるだけ(コンボが切れる)。 ときどき来る「とくだいだるま」が C 要素(でかい・速い・高得点)。 だるまはベクター描画(実在 | 0xd94f4f 0xb63d3d 0xfff2e2 0xe8b84b 0xcfe3f7 0xb8c9de |
| `bg-dashi.svg` | dashi | かわごえまつり(さいたま): 山車(だし)の綱引きリズムゲーム。 ゲージの めもりが まんなか(スイートゾーン)に来た瞬間にタップ=綱を引く。 引くたびに 山車が進み、蔵造りの町並みが流れていく。外すと「およよ…」で一瞬止まるだけ。 ときどき来る「曳っかわせ(ひっかわせ)」= 対向の山車との競演が C 要素(得点2倍タ | 0xf7c873 0xb89b6a 0xa5854f 0x5a4a3a 0x3d3129 0xf7e3b8 |
| `bg-defense.svg` | defense | おせわディフェンス(care): 畑の作物めがけて害虫が四方から迫ってくる。 タップで撃退するウェーブ防衛。逃しても作物は失われない(★なし、careDone のみ)が、 まもった数/のがした数が最後に表示される | 0x9c7d4f 0x8bc063 |
| `bg-eyou.svg` | eyou | さいだいじ えよう(おかやま): まよなかに なげこまれる「しんぎ」を うけとって、もみあいの中を すすむ。 だん1「うけとる」: くらい どうから しんぎが おちてくる。ひかりの すじで おちる ばしょが わかるので、 そこを タップして うけとる。 だん2「こらえる」: まわりから「おし」が くる。やじるしの ほう | 0x14141f 0x3a2f2a 0x241d18 0xffd34d |
| `bg-festival.svg` | festival | おまつり やたいラッシュ(tier4・このゲームの集大成): よるの おまつり会場。おきゃくさんが つぎつぎ やってきて、ふきだしで ほしいものを 見せる。 下の やたい(めいぶつ)を タップして、まちがえずに どんどん わたそう。 - ふきだしの したの ゲージが おきゃくさんの がまん。きれると 😢 で 帰る(コ | 0x8a6242 0xfff8e7 0xe05b5b 0xffffff 0x243057 0x9c7d4f |
| `bg-fish.svg` | fish | フィッシング(いわし): 泳ぐ魚をタップで釣り上げる。 小=1タップ / 中=2タップ / 大=3タップ / ぬし=4タップ(セッション中1〜2回だけ出現)。 一度タップされた魚は「回遊」を始める(画面内で折り返す)が、タップのたびに加速し、 次のタップが遅れると逃げる。★3は ぬしを つりあげないと取れない | 0xa9713a 0xc98f4e 0x8a6242 0xe05b5b |
| `bg-flick.svg` | flick | フリックゲーム(メロン・ゆうがお・キャベツ): 実を引っぱって放し、岩を避けてかごに転がし入れる。 壁と岩で跳ね返る簡易物理。ど真ん中に入ると追加ボーナス。 時間経過で岩が増え、かごが左右に動き出す。 引っぱるほど実が「ぐぐっ」と張りつめる(手応えレイヤー)。岩バウンスは失敗ではなく物理 | 0x8d8d8d 0xa5a5a5 |
| `bg-fukuotoko.svg` | fukuotoko | にしのみやの とおかえびす(ひょうご): 「ふくおとこ えらび」の かいもんしんじ。 もんが ひらいたら、ほんでんまで はしる ― れんだ(タップ)で すすむ ゲーム。 ただし ころんでは いけない: みちには 石だんと ひとの かたまりが あって、 ちかづいたら スワイプで よける(うえ=とぶ / よこ=かわす)。  | 0x2f3f6b 0xc0392b 0x5a4632 0x6b5442 0xffffff 0xffd34d |
| `bg-gion.svg` | gion | ぎおんまつり(きょうと): やまほこの「つじまわし」。 おおきな やまほこは まがれない。だから 竹を しいて 水を まき、 みんなで ロープを ひいて 90どずつ 回す ― それを 指の 回転ジェスチャーに した。 1. まず「竹しき」: ひかった 3まいの 竹を タップして しく(じゅんびの しごと) 2. つぎに | 0x8ec7e8 0xd8c69a 0xbca877 0x6b4a33 0x8a6a4a 0x7a4a2a |
| `bg-hanabi.svg` | hanabi | はなび打ち上げ(ちば・ちょうし みなとまつり): のぼっていく はなびだまを、 よぞらの「わっか」の中でタップすると ジャストで大輪が咲く。 タップが早い/遅い → 小さな花(得点は入る)。ノータップ → しゅう…と消える(コンボが切れるだけ)。 ときどき来る「しゃくだま」が C 要素(ゆっくり・わっかが小さい・大花火 | 0x1c2447 0x24305c 0x3a4a7a 0x11172e 0x0d1226 |
| `bg-hanagasa.svg` | hanagasa | はながさまつり(やまがた): 笠(かさ)まわしゲーム。 やじるしの むきに 指を くるくる まわすと、はなの笠が まわって 得点。 ときどき「ぎゃくまわし!」で むきが かわる(まちがった むきは すすまないだけ=成功保証)。 「はなふぶきタイム」= 得点2倍 が C 要素。 実在の花笠まつりの「笠を まわして おどる | 0x4a3566 0xe05b5b 0xffd34d 0xc9a86a 0xb8935a 0xd94f4f |
| `bg-himatsuri.svg` | himatsuri | よしだの ひまつり(やまなし・ふじよしだ): たいまつ点火リレー。 まちなかに ならぶ 大たいまつ。指で「ひだね」を つかんで はこび、 まだ ついていない たいまつに ふれると 点火(得点)。 ひだねには「のこり時間」があり、かぜで だんだん 小さくなる。 ついている たいまつに ふれると ひだねが 元気に なる(給 | 0x141a33 0x3b3358 0xf0f4ff 0x6b4a2a 0x4a3520 0xffd34d |
| `bg-hyottoko.svg` | hyottoko | ひゅうが ひょっとこ なつまつり(みやざき): おかしな おめんを つけて おどる まつり。 おかめ・ひょっとこ・きつね ― 3つの おめんには それぞれ きまった ポーズが ある。 おはやしの あいずで「どの おめんの ポーズか」が しめされるので、 3つの ボタンから おなじ ものを えらぶ(はんしゃの ゲーム)。 | 0x3a4a7a 0xffd34d 0x4a3a2a 0xfff4dc |
| `bg-ishidori.svg` | ishidori | くわなの いしどりまつり(みえ): 「にほんいち やかましい まつり」の かねと たいこ。 ひかった がっきを タップして たたく。かね(たかい音)と たいこ(ひくい音)を たたきわけるのが しごと。ふたつ どうじに ひかったら 両方 たたく(どちらか だけでは 半分)。 まちがった がっきを たたくと おとが ずれて | 0x2b2f5e 0xe05b5b 0xffd34d 0x6b4a2a 0x8a6a4a 0x3a2a18 |
| `bg-kabuki.svg` | kabuki | ながはま ひきやままつり(しが): 曳山の ぶたいで する「こども かぶき」。 せりふが ながれて、ひかった ポーズマークで キメる(タップ)。 ★ ちょうどの ときに タップ = 「みえを きる」大せいこう。 すこし ずれると「まあまあ」。はやすぎ・おそすぎでも 得点は へらない(コンボが きれるだけ)。 ときどき「 | 0x3a2a44 0x8a2f2f 0x8a6a4a 0x6b4a2a 0x3a2a18 0xffffff |
| `bg-kagura.svg` | kagura | いわみかぐら(しまね): 「やまたのおろち」の まい。8つの あたまの おろちを たいじする。 のびてきた あたまの そばに「やじるし」が でるので、その むきに スワイプして つるぎを ふる。 むきを まちがえると かわされる(コンボ切れ。得点は へらない)。 8つ ぜんぶ たいじすると 大ボーナス → つぎの おろ | 0x2a1f3a 0x8a2f2f 0x6b4a2a 0x5a3a1a |
| `bg-kani.svg` | kani | えちぜん がにまつり(ふくい): かにを ほぐして もりつけるゲーム。 かにの あしの「ひかった かんせつ」を タップで わり、つづけて 中の みを タップで とる。 2タップの「わる → とる」が 1セット。わる前に みを タップしても なにも起きないだけ。 おさら1まい ぶん(6つ)たまると「もりつけ かんせい」で | 0xcfd8e6 0xd94f4f 0xf5f7fa 0xdfe6ee 0xe0503a 0xc93f2c |
| `bg-kantou.svg` | kantou | かんとうまつり(あきた): 竿燈(かんとう)バランスゲーム。 ちょうちんを つけた ながい竿を、下の「て」を左右にドラッグして ささえる。 まっすぐ ささえているあいだ 得点が入りつづけ、8秒たえるごとに 竿が たかくなって 配点アップ(C要素=リスクとリワードの はしご)。よろけたら レベル1に もどるだけ(成功保証 | 0x35406b 0x8a7a62 |
| `bg-karakuri.svg` | karakuri | たかやままつり(ぎふ): からくり人形の 糸あやつりゲーム。 やたいの うえの 人形から 4本の 糸が のびている。ひかった 糸を じゅんばんに「下へ ひく」(ドラッグ)と、人形が 芸(わざ)を つづけていく。 ひととおり できると「げいが きまった!」でボーナス。 ちがう糸を ひいても 人形が すこし よろけるだけ( | 0xaee3f7 0x8a6a4a 0x5a4a3a 0x3d3129 0xd94f4f 0xf5e6c8 |
| `bg-kazariuma.svg` | kazariuma | ふじさきはちまんぐう れいたいさい「ぼした祭り」(くまもと): きれいに かざった うまを ひいて まちを ねりあるく。 うまは おおきな おとや ひとごみに びっくりする ― だから これは「うまを なだめながら すすむ」ゲーム。 ・「すすむ」ボタンで まえへ(すすむと 得点) ・うまの おちつきメーターが さがると | 0xbfe4f5 0xc8b088 0xc0392b 0xffd34d 0xffffff 0x8a6a4a |
| `bg-kingyo.svg` | kingyo | やない きんぎょちょうちん(やまぐち): 竹ひごの わくに 和紙を はって きんぎょちょうちんを つくる。 わくの「おび」の 中を ゆびで なぞって のりを つける ゲーム。 おびから はみ出すと しわに なる(そこは やりなおし。得点は へらない)。 ひとつの ちょうちんを なぞりきると 色が つき、川に うかんでい | 0xfdf3d8 0xffd34d |
| `bg-kokkodesho.svg` | kokkodesho | ながさき くんち「コッコデショ」: たいこやまを そらへ ほうり上げて、かた手で うけとめる ど迫力の だしもの。 だから これは「なげ上げ → うけとめ」の 2だん タイミング。 1. ゲージが みどりの ゾーンに きたら タップ = ちょうど よい ちからで なげ上げ (よわいと ひくい / つよすぎると かたむい | 0x2a2f55 0x4a3a2a 0xffd34d 0x8a2f2f 0xc9a23f 0xffffff |
| `bg-makiwara.svg` | makiwara | つしま てんのうさい(あいち): まきわら舟の ちょうちん飾りゲーム。 ふねの うえに ちょうちんを「はんえん(半円)」に かざる。 ひかった とりつけ位置を タップすると ちょうちんが ともる。 じゅんばんは 自由だが、ひかりは すぐ 別の位置へ 移るので 目と指の 追いかけっこ。 はんえんが 1つ 完成すると ボー | 0x141a33 0x1d3a52 0xffd34d 0x5a4a3a 0x8a6a4a |
| `bg-mikoshi.svg` | mikoshi | かんだまつり(とうきょう): 神輿(みこし)かつぎバランスゲーム。 みこしは かってに かたむいていく。かたむいた側の「はんたい」を押して(押しっぱなしOK) バランスを取り、まっすぐ担げているあいだ どんどん得点が入る。 大きくかたむくと「おっとっと!」でよろけるだけ(落とさない=成功保証)。 ときどき「わっしょいタ | 0xaee3f7 0xb89b6a 0xd94f4f 0xa9713a 0xffd34d 0x3d3129 |
| `bg-mine.svg` | mine | 採掘パズル(さつまいも・らっかせい・ねんど): シャベルの回数に限りがある。 はずれを掘ると「まわり8マスに お宝がいくつあるか」の数字ヒントが出るので、 推理して掘る場所を選ぶ(マインスイーパーの逆型)。 全部見つけると 残りシャベル×ボーナス + 新しい盤面(だんだんシャベルが減る) | 0xc9a06a 0xdbb87f 0x6b4a26 |
| `bg-minyou.svg` | minyou | にいがた まつり(だいみんようながし): 振り(ふり)おぼえゲーム。 まちを ながれる おどりの列。お手本の「ふり」が じゅんばんに ひかるので、 おなじ じゅんばんに タップして そろえる。そろえるほど 列が のびて 得点アップ。 まちがえても おなじ長さで やりなおすだけ(成功保証)。 実在の「大民謡流し」の「みん | 0xf7c873 0xb89b6a 0x8a6a4a |
| `bg-nebuta.svg` | nebuta | ねぶたまつり(あおもり): 太鼓のビートで はねる(跳人=ハネト)ゲーム。 縮んでいく わっかが 的に かさなった しゅんかんに タップ=「ラッセラー!」と はねる。 外しても コンボが切れるだけ(成功保証)。 ときどき「おおねぶたタイム」= ねぶたが せまってきて 得点2倍 が C 要素。 実在のねぶた祭の「囃子に合 | 0x1d2547 0x141a33 0xe05b5b 0xffd34d 0xf2e6c9 0xd94f4f |
| `bg-onbashira.svg` | onbashira | すわの おんばしら(ながの): 木落し(きおとし)ゲーム。 坂を すべりおりる 大きな木。木は 左右に かたむいていくので、 かたむいた「はんたいがわ」を タップして たてなおしながら、下まで おりる。 まっすぐなほど はやく すべり、得点も 高い。おおきく かたむくと 速度が おちるだけ(成功保証)。 1本 おりきる | 0xaee3f7 0x6faf5b 0x8a6a4a 0xa9713a 0xc9a86a 0xffffff |
| `bg-ougi.svg` | ougi | なちの おうぎまつり(わかやま): 12ほんの おおたいまつで、おうぎみこしを むかえる 火の まつり。 プレイヤーの しごとは「たいまつを かかげて あおぐ」こと。 ・たいまつを 上下に ふる(ドラッグ)と 火が おおきくなる = 得点 ・火が よわると きえそうに なるので、ふり つづける(ただし ずっと おなじ  | 0x14213a 0x1f3a2a 0xbfe4f5 0xffffff 0x2f4a6b 0xc0392b |
| `bg-owara.svg` | owara | おわら かぜの ぼん(とやま・やつお): しずかな おどりの「キープ」ゲーム。 胡弓(こきゅう)の しずかな ねいろに あわせて、ゆっくり うごく「ひかる わく」の なかに 指を おいたまま ついていく。入っているあいだ 得点が つみあがる。 はずれても 得点が とまるだけ(成功保証)。 ときどき「かぜが とおる」=  | 0x1b2440 0x141a2e 0xd8c49a 0x2a3358 |
| `bg-pluck.svg` | pluck | つみとり(いちご・まゆ): じゅくした実を おさえて、下に ゆっくり ひっぱる。 びよ〜ん…と のびて「ぷちっ!」で収穫。はやく ひっぱりすぎると くきが切れて 実を落としてしまう(コンボが切れるだけ=成功保証)。あおい実は ぷるんと もどるだけ。 ときどき実る「まぼろしの おおつぶ」(ながく ひっぱる+大得点)が C | 0xa8895c 0x5e9c43 0x7bbf5a |
| `bg-reap.svg` | reap | いねかり(こめ・こまつな): 畑の列をなぞって刈る。 1列を一筆(指を離さず)で刈りきると「ひとふでがり!」ボーナス。 列には🐸カエルが 刈りラインの上に すわっている(1列に最大2匹)。 カエルは ぴょんぴょん はねて場所を変えるので、先にタップで逃がすか、 タイミングを見て なぞるかの判断が入る(まっすぐ引くだけ | 0xaee3f7 0x9fd0b5 0x6faf8b 0xbfe3d1 |
| `bg-rhythm.svg` | rhythm | リズムづみ(ちゃば): 茶畑の うねに そって わかばが ながれてくる。 かごの まえの「わっか」に かさなった瞬間にタップ=つみとり。 ばっちり/おしい の2段階判定。はずしても「すかっ」でコンボが切れるだけ(成功保証)。 ときどき ながれてくる「きんの わかば」= ばっちりで 大得点 が C 要素。 タップ位置は問 | 0xaee3f7 0x6faf5b 0x4c7a35 0x9ccb8f 0xa9713a 0xffffff |
| `bg-rokugatsudo.svg` | rokugatsudo | ろくがつどう(かごしま): なつの よに、絵を かいた とうろうを じんじゃに かける ぎょうじ。 だから これは「とうろうに 絵を かく」ゲーム。 ・したえの てんが すうじの じゅんに ならんでいる ― 1 → 2 → 3 … と タップして つないでいく ・じゅんばんを まちがえると せんが つながらない(コンボ | 0x1f2a4a 0xffffff 0xfff4dc |
| `bg-rokuro.svg` | rokuro | ましこ とうきいち(とちぎ): ろくろと窯の器づくりゲーム。 まわる ねんどの「ひかる おび」を指で押さえ続けると かたちが できていく(3段)。 かたちが完成したら 窯の火加減ゲージ — いい火加減の瞬間にタップで やきあがり! ジャストなら「さいこうのやきあがり」。外しても ふつうに焼ける(成功保証)。 4個ごとに | 0xe8dcc8 0x8a6242 0x9c7d4f 0x7a5a45 0x3d3129 0x6e5a45 |
| `bg-sansa.svg` | sansa | さんさおどり(いわて・もりおか): 2レーンの たいこリズムゲーム。 うえから ながれてくる まるが、ひだり/みぎの たいこに かさなった しゅんかんに その がわを タップ=「ドン!」。りょうほう同時も くる(終盤)。 はずしても コンボが切れるだけ(成功保証)。「パレードタイム」= 2倍 が C 要素。 rhyth | 0x3a4a7a 0xffffff 0xc9a86a 0xf2e6c9 0xd94f4f |
| `bg-scoop.svg` | scoop | すくいとり(しらす・しろえび・さくらえび): ちゅうぶの海の新動詞。 むれ(たくさんの ちいさな いきもの)が 潮に のって ながれてくる。 ざるを 指で うごかして むれの なかを くぐらせると、ざるに たまっていく。 ざるが いっぱいに なったら 上へ「すくいあげる」= 得点(ためるほど 高得点)。 すくいあげずに | 0xaee3f7 0x2f7fa8 0xffffff 0x8fb0c9 |
| `bg-shanshan.svg` | shanshan | とっとり しゃんしゃんまつり: かさおどり。すずの ついた かさを ひらいたり とじたりして おどる。 おんどの あいずを 見て・聞いて、かさの じょうたいを きりかえる ゲーム。 「シャン」  = かさを ひらく(とじているとき だけ 正かい) 「シャシャン」= かさを とじる(ひらいているとき だけ 正かい) すで | 0x35305e 0xffd34d 0x4a3a2a 0xc0392b 0xffe8b0 0x8a6a4a |
| `bg-shell.svg` | shell | かいひきあげ(かき・ほたて・かに): 貝は「釣る」のではなく「つるして そだて、ひきあげる」。 実在の養殖(いかだの垂下連)・かご漁の作業を そのまま動詞にした 2だんかいの遊び。 だん1「ひきあげ」: うみの なかの ロープ(かご)を 指で つかんで 上へ ドラッグ。 はやすぎると 貝が ぱらぱら 落ちる / おそす | 0xaee3f7 0x3f8fb5 0x7fa87a 0x4f7a4a 0x8a6a4a 0x6b4a2a |
| `bg-sousen.svg` | sousen | よこはま みなとまつり(かながわ): 操船パレードゲーム。 指の左右で ふねを あやつり、ながれてくる「はたのゲート」をくぐると得点。 ブイに ぶつかると「ごつん!」でコンボが切れるだけ(沈まない=成功保証)。 ながれてくる「きてきのわっか」に かさなった瞬間タップで「ぽーっ!」ボーナス。 金のわっか=「あいさつの汽笛 | 0xaee3f7 0x8fa8bf 0x5fb4d4 0xffffff 0xd94f4f 0x4a6a8a |
| `bg-sweep.svg` | sweep | ゆきはらい(とうほくの雪下野菜): 雪の山を こすって はらうと 作物が でてくる。 でてきた作物は タップで しゅうかく。ときどき「ふぶき」が きて、 とりのこした作物に また雪が つもる(へるのは 進みだけ=成功保証)。 まれに「きんいろ」の山があり、深く はらうと 大得点(C要素)。 既存動詞との違い = 「こす | 0xcfd8e6 0xb9c6d8 0xf4f7fb 0xdde6ef 0xffffff 0xe6edf5 |
| `bg-tako.svg` | tako | はままつまつり(しずおか): たこあげ 合戦ゲーム。 画面を おしているあいだ 糸を「ひく」= たこが 上がる。はなすと ゆるんで さがる。 ただし ひきすぎると 糸が ぱんぱんに なって きれてしまう(下から やりなおし)。 たこが 高いほど 得点が つみあがる。ときどき 相手の たこが 来て、 高い方が 相手の糸を | 0x7fc8f0 0xe6d3a3 0xffffff 0xd94f4f 0xf5e6c8 0x7a5a9a |
| `bg-tanabata.svg` | tanabata | たなばたまつり(みやぎ・せんだい): かざりつけゲーム。 笹(ささ)の ひかっている フックに、おなじ色の ふきながしを ドラッグして つるす。 色ちがい・とどかない は ぷるんと もどるだけ(コンボが切れるだけ=成功保証)。 まれに「きんの ふきながし」フックが ひかる(大得点)が C 要素。 実在の仙台七夕の「かざ | 0xaee3f7 0x5e9c43 0x7bbf5a 0xffffff |
| `bg-tourou.svg` | tourou | かなざわ ひゃくまんごく まつり(いしかわ): とうろう流しゲーム。 きしべの とうろうを 指で つかんで、川面まで そっと はこんで はなす。 はなす瞬間の 指の はやさが たいせつ: ゆっくり はなすと すーっと ながれ(得点)、 いきおいよく はなすと ひっくり返って ひが きえる(コンボが切れるだけ=成功保証) | 0x1d2338 0x24405e 0x3d3a33 0xffffff 0x8a6242 |
| `bg-tsunahiki.svg` | tsunahiki | なは おおづなひき(おきなわ): まちを ひがしと にしに わけて、おおきな つなを ひきあう ぎょうじ。 これは「れんだ」と「ふんばり」の 2つを あわせた 力くらべ。 ・タップれんだで つなを ひく(すこしずつ こちらに くる) ・あいてが「せーの!」で つよく ひく しゅんかんが ある(あかい あいず) → その | 0x7fd8f0 0xe8d8a8 0x9ccb6f |
| `bg-ushioni.svg` | ushioni | うわじま うしおにまつり(えひめ): ながい くびの「うしおに」が まちを ねりあるき、 いえの もんに あたまを 入れて わるいものを おいはらう。 ゆびで あたまを ドラッグすると くびが にょろにょろ のびる。 ひかっている もんに あたまを 入れると おはらい せいこう。 くびは のばしすぎると もどってしまう | 0x3a5a8a 0x6b5a3a 0x8a3a2a 0x6b2a1a |
| `bg-waraji.svg` | waraji | わらじまつり(ふくしま): おおわらじ担ぎ 行進ゲーム。 したの ひだり👣/みぎ👣を「こうごに」タップすると、おおわらじが 前へ すすむ。 おなじ がわを つづけて タップすると よろけるだけ(コンボが切れる=成功保証)。 ときどき「さかみち」= 1歩2倍 が C 要素。 実在のわらじまつりの「大わらじを かついで | 0xaee3f7 0xb89b6a 0x8a6a4a 0x5a4a3a 0xf7e3b8 0xd8b878 |
| `bg-yamakasa.svg` | yamakasa | はかた ぎおん やまかさ(ふくおか): 「おいやま」で 1トンちかい かきやまを かついで まちを はしる。 ひとりでは とても もたない ― だから ほんものと おなじで「こうたい(交代)」しながら すすむ。 ・タップれんだで はしる(かつぎ手の ちからが へっていく) ・ちからが へった かつぎ手は あかくなる → | 0xffe0b0 0xb9a882 0xd8c8a8 0x8a2f2f 0xc9a23f 0xe8d9a8 |
| `bg-yamayaki.svg` | yamayaki | わかくさやまの やまやき(なら): 山ぜんたいの かれくさに 火を つけて もやす ぎょうじ。 ほんものと おなじで、まず ひとつずつ「ひつけ」に 火を つけ、 火は かぜに のって よこに ひろがる ― プレイヤーは 火の さきに 指で「ひみち」を なぞって まだ もえていない くさむらへ みちびく。 ひみちを つな | 0x1f2545 0xffffff 0x2f4a35 0x3a5a3f |
| `bg-yosakoi.svg` | yosakoi | よさこいまつり(こうち): 両手に「なるこ」を もって おどる。 なるこは「カチッ カチッ」と 2つ 鳴るのが きほん ― だから これは 「1つの あいずに 2れんうち」を そろえる ゲーム。 わっかが ひかったら すばやく 2かい タップ。 1かいだけ / 3かい いじょう / おそすぎ は そろわない(コンボ切れ | 0x2f4a7a 0xd8c69a 0xffd34d |
| `bg-yukake.svg` | yukake | べっぷ おんせんまつり(おおいた): 「ゆかけ」の ぎょうじ。ひしゃくで おんせんの ゆを かけあって まちの みんなを あたためる。ただし あつすぎる ゆは にがてな ひとも いる ― だから これは「ゆの りょうを ちょうせいする」ながおしゲーム。 ・ゆぶねを ながおしして ひしゃくに ゆを ためる(ゲージ) ・な | 0xd8eef5 0xffffff 0xb0d8e8 0x8ec4d8 0x9ad0f5 0xffb08a |
| `bg-yukimatsuri.svg` | yukimatsuri | ゆきまつり(ほっかいどう・さっぽろ): 雪像(ゆきぞう)づくりゲーム。 雪のブロックの かたまりから、うっすら みえる 型の「そと」だけを タップして けずる。 ぞうの部分を けずってしまうと「あぶない!」でコンボが切れるだけ(成功保証)。 ぜんぶ けずると 雪像かんせい! 3体ごとに「おおきな ゆきぞう」= 2倍 が | 0x1d2547 0xf4f7fb 0xffffff 0xe6edf5 0xbfe9f7 |

