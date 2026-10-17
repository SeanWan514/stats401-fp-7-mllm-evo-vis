# Final Project 当天交付报告

更新日期：2026-10-17。已完成数据任务的采集、清洗、整理和五视图接入；后续重点为最终网站整合、任务分类扩展、可用性评估及小组报告。

项目代码与公开数据：[GitHub 分支](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/tree/shilin)。分支：`shilin`。

[草稿 PR #3](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/pull/3) 已创建，可供组员审阅。数据与处理代码交付在小组共同仓库分支中，可视化页面通过独立仓库发布。

## 今天交付了什么

| 交付内容 | 最终数量 | 正确解释 |
| --- | ---: | --- |
| HF 模型仓库 | **18,255 条** | 过滤、去重后的相关仓库；包括微调、adapter、量化与格式转换，不是同等数量的原创模型 |
| 精选比较模型 | **57 个、10 个家族** | 精确到版本与尺寸，核对官方权重、许可与来源 |
| 新版本 | **11 个晚于基线；10 个自 2025-10-01 起发布** | 基线日期为 2025-09-17；不是按仓库修改时间判定新模型 |
| benchmark 长表 | **143,086 行** | 完整保留原来 142,843 个数值，补充 243 个官方表格/图表值，没有重新运行模型评测 |
| 模型关系 | **15 条** | 14 条发布先后，1 条有来源的架构关系；未把时间顺序说成训练继承 |
| 社区反馈 | **21,674 条** | GitHub 19,547 条，HF 2,127 条；每条实际正文/评论只算一次 |
| 有具体任务标签的反馈 | **1,965 条** | 8 个任务定义，另有 19,709 条未分类；标签仍是机器初标 |
| 能关联精选模型的反馈 | **1,507 条** | 关联上下文不等于确认作者实际测试过该精确版本 |

模型仓库采集漏斗：24,182 次观察 → 20,497 个唯一仓库 → 排除 2,242 个 → 保留 18,255 个。已去掉明确随机测试仓库、纯文本版本、冲突的图像生成任务及缺少 VLM 证据的传统视觉条目。家族识别优先使用模型名、明确基座，再使用架构标签，避免训练集名字误导家族分类。仅有 GGUF/MLX 格式不等于量化；154 条冲突元数据保留 unknown。

反馈采集漏斗：45,047 次观察 → 37,738 个唯一源对象 → 保留 21,674 个。来源为官方模型 GitHub issues/comments 与 HF discussion comment events；没有把 Reddit、标题、拆句或多标签当作额外记录。清除了 PR、已知维护者、机器人、纯感谢、事务内容、邮件引用尾部等；76 条明确版本冲突降为家族关联。HF 的 2,127 条作者角色未知，所以统一称社区反馈，不能声称全是独立用户评价。

## “推理”如何处理

按你的补充，中文“推理”纳入 reasoning 候选。视觉、数学、逻辑、多步推理等能力语境进入 reasoning；推理速度、显存、部署、报错等进入运行体验。当前共有 **109 条 reasoning 标签**，中文推理另有 **368 条语境含糊的候选**、**318 条运行语境**。这使“推理任务”得以保留，同时避免把所有部署问题解释成模型推理能力评价。

## 页面和文件怎么用

直接访问 [公开五视图网站](https://owen-1234.github.io/mllm-evidence-explorer/)；页面源码单独保存在 [可视化仓库](https://github.com/Owen-1234/mllm-evidence-explorer)。

已新增 [repo/final.html](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/final.html)：生态增长、任务探索、家族演进、双模型八维雷达、任务–模型证据矩阵。可按家族、时间、来源筛选，选择任务联动矩阵，选择两个模型比较，并查看来源和缺失信息。原来的 interim 数据与主视图代码保留。

在 `repo/` 中运行：

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

页面入口和运行说明见 [五视图源码](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/final.html) 与 [README](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/README.md)。GitHub 文件链接展示源码；在线交互页面请使用上面的公开网站链接。

主要文件：

- [执行方案](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/implementation-plan.md)：要求理解、实施顺序、字段口径与验收清单。
- [英文交付报告](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery.md)：可直接给组员阅读的完成情况与限制。
- [采集与复现说明](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-pipeline.md)：完整命令、依赖、数据字典及发布边界。
- [仓库计数](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/repository_counts.json)、[反馈质量](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/feedback_quality.json)、[模型质量](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/model_data_quality.json)：所有最终数量的来源。
- [公开数据目录](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/tree/shilin/data/final)：仓库表、精选模型、benchmark 压缩长表、关系、任务定义、页面聚合及完整反馈压缩包。

GitHub 小组分支已公开完整反馈与全部原始缓存，提供以下下载入口：

- [完整反馈压缩包](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz)：全部 21,674 条保留反馈，解压后为 JSONL。
- [完整原始缓存压缩包](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/archives/raw-cache-2026-10-17.tar.gz)：全部 1,861 个来源缓存文件，解压后恢复为 `data/raw/`。
- [发布清单与 SHA-256](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/public_data_manifest.json)：每个原始文件、压缩包和完整反馈的哈希及凭据脱敏记录。
- [恢复脚本](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/restore_public_data.py)：核对压缩包和文件哈希后恢复数据，拒绝覆盖不同的本地原件。

公开副本只对少量凭据样式字符串进行脱敏，保留所有反馈记录和缓存文件；本地原始文件未被改写。来源记录中的原始响应哈希与公开副本哈希可能不同，须按发布清单区分。首次采集材料和后补 API 响应的区别仍按原始材料说明保留。

从小组分支克隆后，可直接使用页面聚合；要离线重建完整数据，先执行：

```bash
python3 scripts/restore_public_data.py
```

已有本地原始缓存时跳过恢复，或使用 `--destination` 指向空目录。

## 后续如何使用这批数据

### 1. 接入最终网站：先使用已经生成的页面数据

负责页面的组员可以直接读取 [data/final/view_data.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/view_data.json)。其中已经包含模型、任务、家族、时间序列、可用成绩、关系、反馈聚合和受控摘录，适合用于最终网站的五个视图。现有 [final.html](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/final.html)、[final.js](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/final.js) 和 [final.css](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/final.css) 是可运行的接入参考，可以沿用交互逻辑，再根据小组最终设计调整布局与叙事。

建议先完成一条清楚的操作路径：**选择任务 → 查看有证据的候选模型 → 检查 benchmark 与反馈 → 选择两个模型比较 → 打开原始来源**。前端应展示证据数量、来源和缺失信息；无需在浏览器里加载完整反馈和整个 benchmark 长表。

### 2. 按研究问题选择数据表

公开文件均附小组共同仓库分支中的 GitHub 链接。

| 想回答的问题 | 使用的数据 | 可以制作的图表或结果 |
| --- | --- | --- |
| 本次样本中，图文模型仓库如何随时间增加？哪些家族衍生版本较多？ | [data/final/repositories.jsonl](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/repositories.jsonl) | 按 `created_at` 的月份、`family_id`、`repo_type` 统计唯一仓库数；制作增长图和家族构成图。应称为本次存续仓库样本的创建时间分布。 |
| 2025 年 9 月之后有哪些有发布证据的新模型？ | [data/final/models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/models.json) | 按已核实的 `release_date` 筛选，制作版本时间线、近期模型列表与 metadata 卡片；只有月级日期的模型单独呈现。 |
| OCR、文档理解或 reasoning 任务有哪些候选？ | [tasks.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/tasks.json)、[models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/models.json)、[benchmark_results.csv.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/benchmark_results.csv.gz)、[完整 feedback.jsonl（gzip）](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz) | 按任务定义与 benchmark 映射制作任务–模型证据矩阵，分别展示成绩覆盖、反馈数量与来源。 |
| 两个模型在八个维度上有什么取舍？ | [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/models.json)、[benchmark_results.csv.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/benchmark_results.csv.gz) | 制作雷达与原始分数表，选择相同协议组，显示量纲、来源和缺失维度。 |
| 社区主要讨论什么使用问题？ | [完整 feedback.jsonl（gzip）](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz) | 按 `aspects`、`experience_type`、平台、时间或家族汇总准确性、速度、显存、兼容性等主题，并提供少量脱敏来源例子。 |
| 家族内部的版本顺序和已知关系是什么？ | [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/models.json)、[model_relationships.csv](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/model_relationships.csv) | 制作演进时间线；用不同线型区分 `release_sequence` 与 `architecture_based_on`。 |

### 3. 表与表如何关联

- **模型关联：** [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/models.json) 中 `models[].id` 是精选模型主键。Benchmark 使用 `canonical_model_id` 关联，反馈使用 `model_ids` 关联；不能按模型显示名称模糊拼接。未进入精选层的旧 benchmark 记录仍保存在 baseline registry 中。
- **任务关联：** [tasks.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/tasks.json) 中 `tasks[].id` 连接反馈的 `task_ids`；任务到 benchmark 的映射使用 `benchmark_ids`，映射理由保存在 `mapping_rationale`。
- **家族关联：** 使用 `family_id` 进行家族层统计。只有家族归属的评论留在家族层，不能复制给每一个具体型号。
- **计数单位：** 仓库按唯一 `id`，反馈按唯一 `id`。一条反馈含多个任务时可出现在多个任务桶中，但总体仍只计一次；任务桶相加可能大于独立反馈总数。
- **比较成绩：** 前端精选成绩应筛选 `is_canonical`、`is_primary_metric`、`visualization_eligible`，再检查 `comparability_group`、版本、split、metric 和 unit。同源表的未披露设置继续显示为未知。

### 4. 一个可以直接用于展示的例子：为文档 OCR 选择模型

先选择 OCR 或文档理解任务，读取对应的 OCRBench 或 DocVQA 证据；再按许可、参数信息和实际可用成绩筛出候选。在候选旁边展示与该任务、精确模型有关的评论，检查识别错误、显存和部署问题，随后选两个模型进入雷达和原始分数表。最后保留来源链接与未覆盖的条件，让使用者自行判断取舍。

这个流程可用于课堂 demo 和后续可用性测试。候选名单应由当前筛选条件与可用证据产生，不把下载量、评论数或正面词数量合成“最佳模型”分数。若只有家族级讨论，页面明确显示其归属层级。

### 5. 用于 final report 和 poster

方法部分可以说明：数据来源、采集时间、查询范围、去重单位、排除规则、任务/模型归属方法及缺失处理。结果部分可使用仓库增长、任务覆盖、benchmark 覆盖、社区问题分布和两个候选的比较案例；附上图表所用筛选条件和分母。

固定数量以 [reports/repository_counts.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/repository_counts.json)、[reports/feedback_quality.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/feedback_quality.json) 和 [reports/model_data_quality.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/model_data_quality.json) 为准，结构与复现结果引用 [reports/final_validation.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/final_validation.json) 和 [reports/reproducibility.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/reproducibility.json)。例如，可以报告“在本次 21,674 条保留反馈中，1,965 条被规则识别为包含具体任务”，并注明这些标签由规则生成、准确率尚未测定；不能将其改写为“1,965 位用户完成了任务测试”。

### 6. 修改标签或补充数据以后如何更新

如果调整任务或反馈规则，在 [scripts/process_feedback.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/process_feedback.py) 中修改定义与规则；如果增加精选模型及来源，在 [config/canonical_models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/config/canonical_models.json) 中补充明确证据。处理脚本会重写生成文件，修订应另存为版本化记录，并明确如何在处理步骤应用，避免直接修改最终 JSON 后被覆盖。

克隆分支并恢复公开缓存后，或在已有完整缓存的工作目录中，依次重新运行：

```bash
python3 scripts/collect_repositories.py --process
python3 scripts/build_final_models.py
python3 scripts/process_feedback.py
python3 scripts/build_final_views.py
python3 scripts/validate_final_data.py
python3 scripts/build_static_site.py
```

这些命令使用已有缓存重新生成数据和页面，不会自动获取一个新的时间快照。如果要研究后续变化，应先单独保存当前原始缓存、配置、输出和哈希，再按采集说明建立新的日期快照，记录新增、修改及无法获取的对象。比较不同时点的下载量时还需保留其统计窗口与采集日期。

## 检查与仍需完成的工作

仓库、反馈、视图共 **31 项回归检查通过**。全表主键、引用、来源、数值及页面计数的结果见 [结构检查报告](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/final_validation.json)，全链路离线重建及哈希见 [复现报告](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/reproducibility.json)。默认雷达组合在同一官方表中有八维值，但未披露的完整评测设置仍未知；不能据此声称完成了严格控制的独立评测。

以下内容必须如实保留为待办或限制：

1. **当前 taxonomy 为 8 类。** 未达到建议的 10–20 类，不为凑数创造任务；后续只能按数据中真实且可区分的用途扩展。
2. **日期与评测缺失保留。** 49 个精选模型有日级发布证据，2 个只有月级，6 个未知；4 个模型卡请求受访问限制，已记录。缺分不能补零，跨协议不能直接比较。
3. **首次反馈原始响应并非完整归档。** 首次全量保留了归一化选字段；另有 92 个成功 API 响应和 4 个重定向响应的后补代表性快照，均校验哈希。它们不是首次全部响应，详情见 [原始材料说明](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/feedback_raw_provenance.json)。
4. **小组最终报告、poster 和真实可用性评估仍由对应成员完成。** 本次交付落实你的数据责任并提供可运行接入页，当前交付范围为数据与接入预览，小组最终成果仍需整合。

两项独立的 10,000 条规模目标均达到；相关性、家族、任务、情感和版本归属仍属于带明确限制的元数据/规则判断。数据来自带选择偏差的社区平台，不代表所有使用者，评论条数也不是独立用户数或满意度。
