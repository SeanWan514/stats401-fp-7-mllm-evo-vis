# Final Project 执行方案：MLLM 数据采集、清洗与交付

## Material Passport

- Origin Skill：academic-research-suite / experiment-agent
- Origin Mode：plan，随后按用户追加要求进入实施
- Origin Date：2026-10-17（Asia/Shanghai）
- Verification Status：UNVERIFIED；此标记指整体验收尚未完成，不代表来源未读。实际结果以交付报告为准。
- Version Label：final_data_plan_v2（含当天实施与推理任务口径）
- 负责人：Shilin Ou / Owen；目标是完成数据部分并提供可运行的接入检查页。
- 项目代码：[GitHub 分支](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/tree/shilin)
- 分支：shilin
- 时间要求：用户要求今天完成。下面采用当天并行执行安排，最终课程截止时间尚未另行提供。

## 1. 项目要解决什么问题

根据最新版 Google 项目文档，帮助研究者和开发者为一个图像与文本任务筛选开放权重 MLLM，结合 benchmark 与实际使用反馈比较候选模型，并看清性能取舍和证据缺口。

完整使用流程是：选择任务 → 查看候选模型和证据 → 选出两个模型 → 比较能力 → 查看模型发展与使用问题。数据工作的完成标准是支撑这条流程，而不仅是下载足够大的文件。

资料优先级：最新版 Google 文档和此次任务分工 > 小组口头补充 > 旧分享对话中的建议。旧对话讨论过用已有 benchmark 长表满足规模要求，但不能据此取消新版的两项独立采集目标。旧对话中的网页数量、版本判断和代码结论均须重新核验。

## 2. 交付范围和计数口径

| 数据层 | 目标 | 一条记录的含义 | 验收边界 |
| --- | --- | --- | --- |
| 仓库生态 | 过滤、去重后 ≥10,000 条 | 一个相关 Hugging Face 仓库 | 包含原创发布、微调、adapter、量化，分类保存；不是一万个独立原创模型 |
| 精选比较模型 | 建议 40–60 个，覆盖多个家族 | 精确到版本、大小、Instruct/Thinking 的 canonical model | 这是小组建议规模；核实开放权重、license、发布日期及证据 |
| 社区反馈 | 过滤、去重后 ≥10,000 条 | 一条实际帖子正文或评论对象 | 与仓库目标独立验收；标题、线程数、拆句数、标签数不能代替 |
| 任务分类 | 建议形成 10–20 个有支持的任务 | 有定义、纳入规则和支持反馈的 task | 类别不足就报告，保留 other/unclear，不为数量创造分类 |

反馈需另报：总采集量、独立对象数、有效量、能识别任务的数量、能定位精确模型的数量、只能定位家族的数量、实际体验数量。一个评论可以支持多个 task/aspect，但每个任务内按独立 feedback_id 去重，任务计数之和可以大于评论总数。

模型的 repo_created_at、last_modified、verified_release_date 分开。基线 snapshot 暂以原始文件元数据为准；“2025 年 9 月以后”同时记录是否晚于基线快照、是否自 2025-10-01 起发布，避免边界歧义。不能把旧模型新建量化仓库当成新模型。

## 3. 当天执行顺序

时间为工作安排而非已完成证明。接口耗时或数据不足时立即更新实际结果；不会通过降低相关性凑数。

| 阶段 | 当天安排 | 具体动作 | 输出与进入下一步的条件 |
| --- | --- | --- | --- |
| P0 | 首先完成 | 读取要求；克隆原仓库；建立新分支；核对基线 | 原始数据保持可追溯；字段、计数和责任边界明确 |
| P1 | 先做小样本 | 各类 HF 仓库、多个家族的 HF/GitHub 实际文本；跑完整清洗流程 | 保存 pilot 报告，确认 API、分页、有效率、模型归属率和八维覆盖缺口 |
| P2A | 与 P2B/P2C 并行 | HF 多查询扩量、去重、相关性与衍生分类 | repositories.jsonl 和独立计数报告 |
| P2B | 并行 | 核验精选模型；保留旧 benchmark 长表；补新版本和官方成绩 | models.json、benchmark_results.csv、model_relationships.csv |
| P2C | 并行 | 官方模型社区反馈分页采集、清洗、任务/aspect/情感初标 | feedback.jsonl、tasks.json、样本及误差检查材料 |
| P3 | 数据逐步到位即开始 | 统一 ID；生成轻量聚合；运行五视图检查页 | 实际数据能加载、筛选、比较和追溯 |
| P4 | 最后完成 | 离线重建、质量断言、浏览器检查、更新说明和本地提交 | 实测数量、覆盖、缺口、复现命令及后续工作写入交付报告 |

当天自动化可完成的部分包括采集器、真实采集、清洗、模型/基准证据整理、数据接口与检查页。目标调整与正式用户测试的状态另行记录，不能以自动化处理结果代替实际完成情况。

## 4. 仓库采集路线

使用 [HF model API](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api)，只取公开 metadata、模型卡与必要配置，不下载模型权重，也不执行仓库代码。

1. 通过 image-text-to-text 主标签以及 image-to-text、visual-question-answering 补充发现；同时覆盖较热门和较新建仓库。后两类含传统视觉模型，须增加 VLM 家族/模型卡证据过滤。
2. 跟随 API 的下一页链接；记录每次查询、时间、响应哈希、页数和错误。达到目标不等于完整普查，报告查询边界和抽样偏差。
3. 按稳定仓库 ID 合并交叉查询结果；一个仓库重复访问不会产生新记录。
4. 保留原始响应，再进行可离线重复的清洗。排除明显空壳测试、非图文用途、冲突任务等；含糊的类别写 unknown，保存排除原因。
5. 区分模型卡明示的 base_model_relation 与名称推断。量化、adapter、微调可同时存在，保留多重标志；仅靠名字的分类必须标为 heuristic。
6. 参数记录区分总参数、激活参数与文件中 tensor 数量；无法核实总参数时留空。license 缺失不可默认 permissive，open-weight 也不等于无限制开源。
7. downloads、likes 必须带采集日期；它们是互动/使用热度，不能作为满意度或独立用户数。[HF 下载统计定义](https://huggingface.co/docs/hub/models-download-stats)

生态图描述的是“本次采到且目前仍存在的仓库的创建时间分布”，不能据此声称复原整个 HF 的历史存量。热门排序与近期排序都存在选择偏差。

## 5. 精选模型、八维 benchmark 和关系

保留 OpenVLM 原始文件，先重新核算 285 条模型及全部 benchmark/submetric。旧记录不因未进入精选列表而丢失，使用 baseline registry 与 canonical crosswalk 连接。原始表里的发布日期不是自动核验结果。

新模型发现后依次核查官方模型卡、官方代码仓库、发布公告/技术报告。每条记录保存 exact repo/version、family、开放权重状态、license、总/激活参数、发布证据。模型卡更新日期不代替发布日期，家族首发日期也不能套给随后发布的全部尺寸。

已确认可用于起步的来源包括 [Qwen3-VL 官方发布记录](https://github.com/QwenLM/Qwen3-VL)（不同版本在 2025-09-23、10-04、10-15、10-21 分批发布），以及 [Molmo2 官方发布](https://allenai.org/blog/molmo2)和[模型卡](https://huggingface.co/allenai/Molmo2-8B)。后续更近版本继续用官方来源核验；这些例子不表示每个模型均有八维可比成绩。

| 维度 | 必须核对的可比条件 |
| --- | --- |
| MMMU | 标准版/Pro、VAL/TEST、Overall 或子项 |
| MathVista | benchmark 版本、测试划分、overall 指标 |
| MMBench | EN/CN、v1.0/v1.1、DEV/TEST、评测设置 |
| MM-Vet | 版本、评判方法、overall 的定义 |
| HallusionBench | aAcc/fAcc/qAcc 等不同指标不可混用 |
| OCRBench | 版本和原始分数范围；不要默认每张表都已换算为百分数 |
| ChartQA | split、accuracy/relaxed accuracy、human/augmented/overall |
| DocVQA | split、ANLS/其他指标、原始单位 |

长表每行保留 model × benchmark/version × split × setting × metric × source。保留 raw_score、unit、source_type（官方自报/第三方评测/基线继承），不挑最高成绩覆盖其他来源。unknown setting 不自动判成可比；同一张官方对比表也要说明仍未披露的评测条件。

雷达归一化采用有依据的固定量纲，不能随筛选结果重算 min–max。缺失保持 null，不能补零或用总体平均值补齐。先检查是否存在八维都有充分可比证据的两模型；不满足时在交付前报告，并明确哪些维度不可比较。

关系分为 sourced derivation（如 fine_tuned_from、quantized_from、adapter_of）和 release_sequence。每条边有来源及证据；时间先后不是训练继承。未知祖先不补连线。

## 6. 反馈采集、清洗和标注

来源优先级为 HF 模型 Discussions → 官方模型 GitHub Issues/Discussions。Reddit 不作为完成依赖；按[当前官方访问规则](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data)，研究访问需适合该项目的研究授权，获准后再增加。

HF 需要逐线程取实际 comment events，排除 PR、状态变化、提交事件和隐藏内容，不能以讨论标题或列表数字计数。[HF community API](https://huggingface.co/docs/huggingface_hub/en/guides/community)

GitHub 取 state=all 的 issues 正文和 issue comments，排除包含 pull_request 的对象；Discussions 使用 GraphQL，对正文、comments、replies 分别分页并按对象 ID 去重。仓库级 comment API 可减少请求，但必须关联 issue 元数据后再排除 PR。[Issues](https://docs.github.com/en/rest/issues/issues)、[Issue comments](https://docs.github.com/en/rest/issues/comments)、[Discussions](https://docs.github.com/en/graphql/guides/using-the-graphql-api-for-discussions)

清洗规则：

- 以平台 + 稳定 object_id 定义记录；编辑版本、重试、跨查询重复不扩量。
- 排除空文本、纯感谢/推广、自动消息、无关管理事务；对重复粘贴保留判断证据。短文本不能仅因字符少就一律判无效，相关的简短使用报告需检查。
- 实际体验、意向、实质问题分开，维护者回应保留上下文且不自动进入用户满意度分母。纯视频任务单列范围；主分析聚焦图文 MLLM。
- 保留原文、清洗文本、语言、thread、source URL、发布时间和采集时间。公开交付尽量只给必要摘录及来源，不顺带公开个人信息。
- 模型归属使用精确名称、repo 上下文和对话证据；“Qwen 很慢”不能批量记给所有 Qwen 版本。family-only、ambiguous、unknown 单列。
- 从试采样本归纳 task taxonomy，合并同义任务。按用户补充，“推理”可作为 reasoning 任务：视觉、数学、逻辑、多步推理纳入；仅谈推理速度、显存、部署、报错时标注运行体验。无充分上下文的泛称保留为候选，保留歧义状态。部署的显存/兼容性属于 practical aspect，不强塞为 OCR 等终端任务。
- aspect 可包括 OCR quality、reasoning、hallucination、speed、memory、compatibility；每个 aspect 保存极性。accurate but slow 必须保留能力正面与速度负面。
- 情感初标支持 positive、negative、mixed、neutral、non-evaluative；处理否定和对比，不能把包含 good 一词就当成总体正向。

所有任务、aspect 和情感结果均为规则生成标签，不作为已测定准确率的真实标签。

同模型反馈至少展示评论数、线程数、可用时的独立贡献者数、来源、时间窗、语言和归属置信度。评论平台与发布时间不同会影响结果；不能把评论正向比例直接解释为全体用户满意度。

## 7. 数据交付接口

| 文件 | 核心内容 |
| --- | --- |
| [原始缓存压缩包](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/archives/raw-cache-2026-10-17.tar.gz) | 完整采集缓存、模型卡与来源信息；公开副本对凭据样式字符串脱敏，详情见发布清单 |
| data/final/repositories.jsonl | repo_id、publisher、family、task、创建/修改时间、license、参数证据、downloads/likes、衍生分类和 provenance |
| data/final/models.json | canonical models、baseline registry、repo crosswalk、八维定义、发布日期证据 |
| data/final/benchmark_results.csv | 带版本、split、setting、metric、unit、score 和来源的长表 |
| data/final/model_relationships.csv | source/target model_id、关系类型、来源、证据 |
| [完整反馈压缩包](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz) | 独立反馈、文本、模型/家族归属、任务/aspect/情感、标注方法和验证状态 |
| data/final/tasks.json | task_id、定义、纳入规则、benchmark 映射及映射理由 |
| data/final/view_data.json | 从上述表生成的轻量前端聚合与受控证据摘录 |
| reports/ | pilot、计数漏斗、覆盖、排除原因、质量检查、最终缺口 |
| scripts/、docs/、README | 采集、离线清洗、重建命令、数据字典、方法与限制 |

共同规则：主键稳定；所有时间 ISO 格式；未知数值为 null，不能为 0；未知分类明确命名；相关文件使用同一 model_id/task_id/family_id。来源文字当数据处理，网页以安全文本方式显示。

## 8. 五视图与数据责任对应

| 视图 | Owen 提供什么 | 交付检查 |
| --- | --- | --- |
| 生态增长 | 仓库创建时间、家族、衍生类型；独立的已核实模型发布时间 | 两种计数模式不混用；筛选后总数对账；不完整时段和抽样范围可见 |
| 任务探索 | 有定义的任务、独立反馈计数、分母、来源摘录 | 词云配数量列表；选任务联动矩阵；多标签不膨胀底层记录 |
| 家族演进 | 精确模型、已核实日期、有来源的关系边 | 发布顺序与继承关系区分；缺失祖先不编造 |
| 双模型雷达 | 八维 raw scores、固定量纲、同条件比较组、metadata | 缺失可见；能看原始数值和来源；不把未知 setting 当可比 |
| 任务–模型证据矩阵 | task–benchmark 映射、模型级与家族级反馈、覆盖统计 | benchmark、使用经验与提及数量分开；可选两模型进入雷达 |

单独新增 final.html 作为数据接入检查页，原 interim 页面保留。检查页帮助黄宇轩核实数据交接，并不替代他对最终整站设计、课程说明和用户评估的责任。

## 9. 采集与质量保障

采集器应支持分页、缓存、断点、有限重试。根据 [HF rate limits](https://huggingface.co/docs/hub/rate-limits) 和 [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) 读取响应限流信息；遇到 403/429 或权限拒绝要记录并遵守，不通过换身份规避。凭据不写入文件、日志或 Git。

计数报告必须能解释 raw → unique → relevant → accepted 每一步。按模型/家族、平台、年份、语言、任务、benchmark、缺失字段报告覆盖。试采的热门仓库保留率不能不加区分地外推全生态。

复现分两层：在线重采会受源站变化影响；从冻结 raw 离线处理则应产生相同 ID、清洗规则、计数和内容。保存输入哈希、脚本版本、配置及来源快照，重跑不覆盖原始证据。

## 10. 最终验收清单

- [x] ≥10,000 条相关唯一仓库：18,255 条，采用元数据规则过滤。
- [x] ≥10,000 条独立社区反馈：21,674 条；具体任务 1,965 条，精选模型关联 1,507 条。
- [x] 57 个精选模型覆盖 10 家族；11 个晚于基线，10 个自 2025-10-01 起发布，日期/权重/许可附来源。
- [x] 保留原有 142,843 个 benchmark 数值，共交付 143,086 行；默认八维组合与比较限制已报告。
- [x] 15 条关系均有类型和来源，未知祖先留空。
- [x] 当前 taxonomy 为 8 类，保留 unknown；标签由规则生成。
- [ ] 建议的 10–20 类 taxonomy 尚未达到，后续按真实用途扩展。
- [x] 结构检查通过：主键、跨表引用、来源、有限数值和页面计数核对成功；科研有效性仍受来源与未验证标签限制。
- [x] 五视图接入实际数据，筛选、联动、来源与缺失状态已检查。
- [x] 全链路离线重建的 8 个输出逐字节一致；README 给出复现命令。反馈首采缓存为归一化选字段，完整响应后补归档的范围见交付报告。
- [x] [交付报告](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery-zh.md) 已列出完成情况、数据限制与后续工作。仓库/反馈/视图 31 项回归检查通过。

任一 10,000 目标不能达到时，立即报告实测保留量、差额、来源耗尽/权限/相关性原因，以及可用替代。替代可能包括更多相关官方源、独立公布的偏好数据或已有 benchmark 长表，但必须由小组向教师申请调整，不能自行宣布原目标已满足。
