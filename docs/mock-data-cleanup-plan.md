# `App.tsx` Mock 鏁版嵁娓呯悊寮€鍙戣鍒?
> 鏃ユ湡: 2026-06-23
> 褰撳墠涓绘枃浠? `src/app/App.tsx`
> 褰撳墠瑙勬ā: 绾?`6464` 琛?
> 鐩爣: 灏嗕粛娈嬬暀鍦?`App.tsx` 鍐呯殑 mock 鏁版嵁銆佸浘琛ㄦ牱鏈暟鎹拰閲嶅 helper 杩佺Щ鍒?`src/app/features/*`锛岃 `App.tsx` 鍙繚鐣欓〉闈㈢紪鎺掋€佺姸鎬佸拰浜や簰閫昏緫銆?
## 鐩爣

- 娑堥櫎 `App.tsx` 涓?`features/*` 涔嬮棿鐨勯噸澶?mock 鏁版嵁銆?- 缁熶竴 mock 鏁版嵁褰掑睘锛岄伩鍏嶅悓涓€浠芥牱鏈湪澶氫釜鏂囦欢涓淮鎶ゃ€?- 娓呯悊宸茬粡娌℃湁寮曠敤浠峰€肩殑姝讳唬鐮併€?- 鍦ㄤ笉鏀瑰彉椤甸潰琛屼负鐨勫墠鎻愪笅缂╁皬 `App.tsx` 浣撶Н锛岄檷浣庡悗缁媶鍒嗘垚鏈€?
## 褰撳墠鍙戠幇

### 1. `intraday` 鐩稿叧鏁版嵁宸插湪 feature 鍐呭瓨鍦ㄦ寮忓疄鐜?
`App.tsx` 閲屼互涓嬪父閲忓凡缁忚兘鍦?`src/app/features/intraday` 鎵惧埌鍚屾簮瀹炵幇鎴栫瓑浠峰鍑猴細

- `overlayProductOptions`
- `baseTrendProductOptions`
- `anonymousTrendProductOptions`
- `compareProductOptions`
- `trendModeTabs`
- `trendRateSeries`
- `trendVolumeSeries`
- `trendVolumeColors`
- `trendAxisLabels`
- `trendPriceTicks`
- `trendVolumeTicks`
- `intradaySeries`
- `intradayVolumeSeries`
- `intradayOverlaySeriesByProduct`
- `intradayTimeLabels`
- `historyRangeTabs`
- `historicalCloseDatasets`
- `historicalProductSeries`

浠ヤ笅 helper 涔熷凡缁忓湪 `src/app/features/intraday/intraday.utils.ts` 鏈夊疄鐜帮紝鍙洿鎺ユ敼涓?import锛?
- `trendProductLabel`
- `anonymousTrendProductLabel`
- `getIntradayRateSeries`
- `overlayProductLabel`
- `buildOverlaySeries`
- `buildHistoricalSeries`
- `buildCompactVolumeTicks`
- `buildSpreadAxisLabels`
- `buildAxisTickLabels`
- `buildAxisLabels`

璇存槑锛?
- `App.tsx` 鍓嶅崐娈典繚鐣欎簡涓€鎵?intraday/history 鏁版嵁鍓湰銆?- `App.tsx` 鍚庡崐娈靛張淇濈暀浜嗕竴鎵?intraday/history helper 鍓湰銆?- 杩欎袱閮ㄥ垎閮藉簲绾冲叆鏈娓呯悊鑼冨洿銆?
### 2. `institution-period` 浠嶆湁涓€閮ㄥ垎鏁版嵁鐣欏湪 `App.tsx`

浠ヤ笅鏁版嵁宸茬粡鍦?`src/app/features/institution-period/institutionPeriod.data.ts` 涓瓨鍦細

- `fundStructureLegendItems`
- `fundStructureRangeTabs`

浣嗕互涓嬫暟鎹洰鍓嶄粛鍙瓨鍦ㄤ簬 `App.tsx`锛屽缓璁縼鍏?`institution-period.data.ts`锛?
- `rightLowerTabs`
- `fundStructureBars`
- `fundStructureRangeData`
- `auxChartLabels`
- `generateFundStructureBars`
- `generateMonthLabels`
- `generateHalfYearLabels`

鏈湴绫诲瀷涔熷缓璁敹鍙ｅ埌 feature 绫诲瀷灞傦細

- `FundStructureRange`

### 3. `shell` 鐩稿叧姹囨€诲尯鍧椾粛鎸傚湪 `App.tsx`

浠ヤ笅缁撴瀯浠嶇敱 `App.tsx` 鏈湴缁存姢锛屼絾鏇撮€傚悎鏀跺彛鍒?`src/app/features/shell`锛?
- `leftSections`
- `exchangeRepoSection` 鐨勬暟鎹潵婧?
褰撳墠 `src/app/features/shell/` 鐩綍鍙湁 `shell.data.ts`锛岃繕娌℃湁 `index.ts`锛屽洜姝ら渶瑕佸厛琛?barrel export銆?
寤鸿锛?
- 灏?`leftSections` 杩佸叆 `shell.data.ts`
- `exchangeRepoSection` 涓嶅崟鐙瓨绗簩浠芥暟鎹紝缁х画鍦ㄤ娇鐢ㄥ閫氳繃 `leftSections.find(...)` 娲剧敓锛岄伩鍏嶅弻婧愮淮鎶?
### 4. `sentiment` 鏁版嵁灏氭湭 feature 鍖?
浠ヤ笅鍐呭浠嶅彧瀛樺湪浜?`App.tsx`锛?
- `SentimentPoint`
- `generateSentimentSeries`
- `sentimentTrendData`
- `sentimentRealtimeData`

寤鸿鏂板缓锛?
- `src/app/features/shell/sentiment.data.ts`

### 5. 褰撳墠鐗堟湰涓嶉渶瑕佸啀鍋氭棫璁″垝閲岀殑 NCD 杩佺Щ

鏃х増璁″垝鎻愬埌鐨?`ncdTrendDates6m` 缂哄け闂锛屽湪褰撳墠浠撳簱閲屽凡缁忎笉鏄?blocker锛?
- `src/app/features/ncd/ncd.data.ts` 宸插鍑?`createNcdTrendDates`
- `src/app/features/ncd/NcdCard.tsx` 宸茬洿鎺ヤ娇鐢ㄨ鑳藉姏
- 褰撳墠 `src/app/App.tsx` 涓篃娌℃湁娈嬬暀鍚屽悕 NCD mock 鏁版嵁鍧?
鏈疆娓呯悊鍙笉鍐嶆妸 NCD 浣滀负涓讳换鍔°€?
### 6. 鍙洿鎺ュ垹闄ょ殑姝讳唬鐮?浣庝环鍊兼畫鐣?
浠ヤ笅鍐呭鐪嬭捣鏉ュ凡缁忎笉鍐嶆壙鎷呮湁鏁堣亴璐ｏ紝搴斿湪鏇挎崲瀹屾垚鍚庣‘璁ゅ垹闄わ細

- `cfetsSummaryCards`
- `cfetsDetailRows`

鍏朵腑锛?
- `auxChartLabels` 鐩墠鍙负 `fundStructureRangeData["14d"]` 鏈嶅姟
- 涓€鏃?`fundStructureRangeData` 杩佸叆 feature锛宍auxChartLabels` 涔熷簲涓€骞惰縼璧帮紝涓嶅啀鐣欏湪 `App.tsx`

### 7. 棰濆娉ㄦ剰鐐?
褰撳墠 `App.tsx` 涓瓨鍦ㄤ竴浜涚被鍨嬩娇鐢ㄤ笌瀵煎叆鏁寸悊鏈轰細锛屾湰娆￠『鎵嬩竴璧锋敹鏁涘嵆鍙細

- `TrendMode`
- `SpreadProduct`
- `SummaryTableSection`
- `ExchangeMarketSplitSection`

杩欎簺涓嶄竴瀹氶兘鏄?bug锛屼絾鍦ㄦ浛鎹?import 鐨勮繃绋嬩腑搴旂粺涓€妫€鏌ワ紝閬垮厤鐣欎笅缂栬瘧鍣煶銆?
## 瀹炴柦姝ラ

### Step 1: 鍏堣ˉ榻?feature 灞傚嚭鍙?
鐩爣锛氬厛璁?`App.tsx` 鏈夌ǔ瀹氱殑鏇夸唬 import 鏉ユ簮锛屽啀鍒犻櫎鏈湴鍓湰銆?
#### 1a. `src/app/features/shell/shell.data.ts`

鏂板瀵煎嚭锛?
- `leftSections`

瀹炵幇寤鸿锛?
- 缁х画澶嶇敤 `xrepoSummarySection`
- `exchangeRepoSection` 涓嶅崟鐙?export锛屽彧淇濈暀 `leftSections` 浣滀负鍞竴婧?
#### 1b. 鏂板缓 `src/app/features/shell/sentiment.data.ts`

鏂板瀵煎嚭锛?
- `SentimentPoint`
- `generateSentimentSeries`
- `sentimentTrendData`
- `sentimentRealtimeData`

#### 1c. 鏂板缓 `src/app/features/shell/index.ts`

缁熶竴 re-export锛?
- `shell.data.ts`
- `sentiment.data.ts`

#### 1d. `src/app/features/institution-period/institutionPeriod.data.ts`

杩佸叆骞跺鍑猴細

- `rightLowerTabs`
- `auxChartLabels`
- `fundStructureBars`
- `fundStructureRangeData`
- `generateFundStructureBars`
- `generateMonthLabels`
- `generateHalfYearLabels`

濡傛灉杩欎簺 helper 浠呬负 data 鏂囦欢鍐呴儴鏈嶅姟锛屼篃鍙互鍙鍑烘渶缁堟暟鎹璞★紝涓嶅己鍒跺鍑哄叏閮?helper銆備紭鍏堜繚鎸?API 鏈€灏忓寲銆?
#### 1e. `src/app/features/institution-period/index.ts`

褰撳墠宸茬粡鏈?`export * from "./institutionPeriod.data";`锛岀悊璁轰笂鏃犻渶棰濆鏀瑰姩銆?
濡傛灉鎷嗗埌鏂版枃浠讹紝鍒欒寰楄ˉ re-export銆?
### Step 2: 灏?`App.tsx` 鍒囨崲鍒?feature import

鎶?`App.tsx` 涓粛浣跨敤鏈湴 mock 鏁版嵁鐨勪綅缃垏鍒?feature import锛岄噸鐐瑰寘鎷細

- `./features/intraday`
- `./features/institution-period`
- `./features/shell`

寤鸿鎸夋ā鍧楀垎鎵规浛鎹細

1. 鍏堟浛鎹?`intraday` 鐩稿叧鏁版嵁鍜?helper
2. 鍐嶆浛鎹?`institution-period`
3. 鏈€鍚庢浛鎹?`shell` 涓?`sentiment`

杩欐牱鍑洪敊鏃舵洿瀹规槗瀹氫綅銆?
### Step 3: 鍒犻櫎 `App.tsx` 涓殑鏈湴 mock 鍓湰

鏇挎崲瀹屾垚鍚庯紝鍒犻櫎 `App.tsx` 涓殑娈嬬暀鏁版嵁鍧楋紝涓昏鍖呮嫭锛?
- 椤甸潰椤堕儴鐨勫ぇ娈?summary/intraday/history/fund-structure/sentiment mock 甯搁噺
- 椤甸潰搴曢儴閲嶅鐨?intraday/history helper
- 宸叉棤寮曠敤鐨?`cfetsSummaryCards`銆乣cfetsDetailRows`
- 鏈湴閲嶅绫诲瀷 `FundStructureRange`銆乣SentimentPoint`

淇濈暀鍘熷垯锛?
- 缁勪欢鍐呴儴鐨勬淳鐢熺姸鎬佷繚鐣?- 缁勪欢娓叉煋涓撳睘鐨勫皬鍨嬭绠楅€昏緫淇濈暀
- 鍙湁鈥滃彲琚?feature 灞傛嫢鏈夌殑鏁版嵁/宸ュ叿鈥濇墠杩佽蛋

### Step 4: 鏀跺熬鏁寸悊 import/type

鍒犻櫎鏈湴鍓湰鍚庯紝琛ラ綈鎴栨敹鏁涗互涓嬪唴瀹癸細

- `import type { FundStructureRange } from "./features/institution-period"`
- `TrendMode` / `SpreadProduct` 绛夌被鍨嬪鍏ュ綊浣?- 鍒犻櫎涓嶅啀闇€瑕佺殑 `SummaryTableSection` / `ExchangeMarketSplitSection` 渚濊禆锛屾垨淇濈暀鍏跺繀瑕佷娇鐢?
### Step 5: 楠岃瘉

寤鸿鑷冲皯鎵ц锛?
```bash
npm run build:react
npm run test:react-dashboard
```

骞跺仛涓€杞墜宸?smoke check锛?
- 澶ц浠锋牸椤?- 鍖垮悕鎴愪氦 / 鍒嗘椂鍥?- 鍔犳潈浠锋牸 / 鍘嗗彶璧板娍
- 鏈烘瀯鏈熼檺鍙充晶鍥捐〃
- 鎯呯华瓒嬪娍鍗＄墖

## 鎺ㄨ崘鎵ц椤哄簭

```text
Step 1  琛ラ綈 shell / sentiment / institution-period 瀵煎嚭
Step 2  App.tsx 鍒囨崲 import 鏉ユ簮
Step 3  鍒犻櫎 App.tsx 鏈湴 mock 鏁版嵁涓庨噸澶?helper
Step 4  娓呯悊绫诲瀷涓庢棤鐢?import
Step 5  build + test + smoke check
```

## 椋庨櫓鐐?
### 1. 闅忔満鏁版嵁瀵艰嚧鑲夌溂瀵规瘮涓嶇ǔ瀹?
`intraday`銆乣institution-period`銆乣sentiment` 閲屼粛鏈?`Math.random()` 鐢熸垚閫昏緫銆?
杩佺Щ鏂囦欢浣嶇疆涓嶄細鏀瑰彉璁捐鎰忓浘锛屼絾椤甸潰姣忔鍒锋柊鏈潵灏卞彲鑳戒笉鍚岋紝涓嶈兘鐢ㄦ埅鍥鹃€愬儚绱犳瘮瀵逛綔涓哄敮涓€楠屾敹鏍囧噯銆?
### 2. `exchangeRepoSection` 涓嶅缓璁淮鎶ょ浜屼唤

濡傛灉鍚屾椂缁存姢锛?
- `leftSections`
- `exchangeRepoSection`

寰堝鏄撳嚭鐜版暟鎹紓绉汇€?
鎺ㄨ崘鍙繚鐣?`leftSections`锛屽湪浣跨敤鐐规淳鐢熴€?
### 3. 鐜版湁涓枃瀛楃涓插瓨鍦ㄧ紪鐮佸巻鍙查棶棰?
閮ㄥ垎鏂囦欢宸叉湁涔辩爜/缂栫爜閬楃暀銆?
鏈浠诲姟浠モ€渕ock 鏁版嵁褰掍綅鈥濅负涓伙紝涓嶅缓璁『鎵嬪ぇ瑙勬ā淇鏂囨缂栫爜锛屽惁鍒?diff 浼氬彉寰楀緢鍣紝澧炲姞鍥炲綊鎴愭湰銆?
## 瀹屾垚鏍囧噯

- `App.tsx` 涓嶅啀鎸佹湁 feature 绾?mock 鏁版嵁婧?- `intraday` / `institution-period` / `shell` / `sentiment` 鐨?mock 鏁版嵁褰掑睘娓呮櫚
- `App.tsx` 鍙繚鐣欑紪鎺掋€佺姸鎬併€佷簨浠跺拰蹇呰娲剧敓閫昏緫
- `npm run build:react` 閫氳繃
- `npm run test:react-dashboard` 閫氳繃

## 棰勪及鏀剁泭

- `src/app/App.tsx` 棰勮鍙啀鍑忓皯绾?`600-800` 琛?- mock 鏁版嵁鐨勭淮鎶ゅ叆鍙ｄ粠鈥滈〉闈富鏂囦欢鈥濆洖鏀跺埌鈥滃搴?feature鈥?- 鍚庣画缁х画鎷?`App.tsx` 鏃讹紝椋庨櫓浼氭槑鏄句笅闄?
