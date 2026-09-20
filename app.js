const COLORS = ["#135b43", "#dc6d35", "#39759b", "#7c6196", "#b08a32", "#a44847", "#398b82", "#87918b"];
const parseDate = d3.utcParse("%Y-%m-%d");
const formatDate = d3.utcFormat("%b %d, %Y");
const formatMonth = d3.utcFormat("%b %Y");
const tooltip = d3.select("#tooltip");
let state;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"}[char]));
}

function hashJitter(value, magnitude = 6) {
    let hash = 0;
    for (const char of String(value)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return ((Math.abs(hash) % 1000) / 999 - 0.5) * magnitude * 2;
}

function chartFrame(selector, height, left = 74, minimumWidth = 320) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    const width = Math.max(minimumWidth, container.node().clientWidth);
    const margin = {top: 24, right: 28, bottom: 58, left};
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
    const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    return {svg, plot, width, height, margin, innerWidth: width - margin.left - margin.right, innerHeight: height - margin.top - margin.bottom};
}

function addAxes(frame, x, y, xLabel, yLabel, yTicks = 6) {
    frame.plot.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).ticks(yTicks).tickSize(-frame.innerWidth).tickFormat(""));
    frame.plot.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${frame.innerHeight})`)
        .call(d3.axisBottom(x).ticks(Math.max(3, Math.min(7, frame.innerWidth / 120))).tickFormat(formatMonth));
    frame.plot.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(yTicks));
    frame.svg.append("text").attr("class", "axis-title").attr("data-axis", "x")
        .attr("x", frame.margin.left + frame.innerWidth / 2).attr("y", frame.height - 14)
        .attr("text-anchor", "middle").text(xLabel);
    frame.svg.append("text").attr("class", "axis-title").attr("data-axis", "y")
        .attr("transform", "rotate(-90)").attr("x", -(frame.margin.top + frame.innerHeight / 2)).attr("y", 18)
        .attr("text-anchor", "middle").text(yLabel);
}

function dateDomain(models) {
    const extent = d3.extent(models, d => d.date);
    const pad = 1000 * 60 * 60 * 24 * 30;
    return [new Date(+extent[0] - pad), new Date(+extent[1] + pad)];
}

function radiusScale(models) {
    const known = models.filter(d => Number.isFinite(d.parameters_b));
    const max = d3.max(known, d => d.parameters_b) || 1;
    return d3.scaleSqrt().domain([0, max]).range([3.2, 10]);
}

function pointFill(d) {
    return d.open_weight ? state.color(d.organization_group) : "#fffdf8";
}

function pointStroke(d) {
    return state.color(d.organization_group);
}

function tooltipHtml(d, metric) {
    const score = metric && d.scores[metric.id] != null ? `${d.scores[metric.id]} ${metric.unit}` : "Not available";
    return `<strong>${escapeHtml(d.name)}</strong>
        <span class="muted">${escapeHtml(formatDate(d.date))}</span><br>
        Provider: ${escapeHtml(d.organization)}<br>
        Parameters: ${escapeHtml(d.parameters_label)}<br>
        Language: ${escapeHtml(d.language_model)}<br>
        Vision: ${escapeHtml(d.vision_model)}<br>
        ${metric ? `${escapeHtml(metric.label)}: ${escapeHtml(score)}<br>` : ""}
        Weights: ${d.open_weight ? "Open" : "Closed or undisclosed"}`;
}

function showTooltip(event, d, metric) {
    tooltip.html(tooltipHtml(d, metric)).attr("hidden", null);
    moveTooltip(event);
}

function moveTooltip(event) {
    const bounds = event.currentTarget?.getBoundingClientRect?.();
    const pointerX = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : (bounds?.left ?? 8);
    const pointerY = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : (bounds?.bottom ?? 8);
    const x = Math.min(window.innerWidth - 465, pointerX + 18);
    const y = Math.min(window.innerHeight - 355, pointerY + 18);
    tooltip.style("left", `${Math.max(8, x)}px`).style("top", `${Math.max(8, y)}px`);
}

function hideTooltip() { tooltip.attr("hidden", true); }

function bindMarks(selection, metric = null) {
    selection
        .attr("class", "mark")
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", d => `${d.name}, ${formatDate(d.date)}, ${d.organization}`)
        .on("pointerenter focus", (event, d) => showTooltip(event, d, metric))
        .on("pointermove", moveTooltip)
        .on("pointerleave blur", hideTooltip)
        .on("click keydown", (event, d) => {
            if ((event.type === "click" || event.key === "Enter") && d.url) window.open(d.url, "_blank", "noopener");
        });
}

function markerSize(model) {
    if (!Number.isFinite(model.parameters_b) || model.parameters_b <= 0) return 4.5;
    return Math.max(4.5, Math.min(11.5, 4 + Math.sqrt(model.parameters_b) * .5));
}

function categoryOrder(models, field) {
    return d3.rollups(models, values => values.length, d => d[field])
        .sort((a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0]))
        .map(d => d[0]);
}

function tensorTooltipHtml(model, metric, plane) {
    const score = model.scores[metric.id] == null ? "Not available" : `${model.scores[metric.id]} ${metric.unit}`;
    const channelRows = {
        overall: [[metric.label, score]],
        language: [["Language family", model.language_family], ["Language model", model.language_model]],
        vision: [["Vision family", model.vision_family], ["Vision model", model.vision_model]]
    };
    const rows = [
        ["Channel", plane.label],
        ["Release", formatDate(model.date)],
        ["Provider", model.organization],
        ["Parameters", model.parameters_label],
        ...channelRows[plane.id],
        ["Weights", model.open_weight ? "Open-weight" : "Closed or undisclosed"]
    ];
    return `<strong>${escapeHtml(model.name)}</strong><table class="tooltip-table"><tbody>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>`;
}

function bindTensorMarks(selection, metric, plane, isActive) {
    selection
        .attr("tabindex", isActive ? 0 : -1)
        .attr("aria-hidden", isActive ? null : "true")
        .attr("role", "button")
        .attr("aria-label", model => `${plane.label} plane: ${model.name}, ${formatDate(model.date)}, ${model.organization}`)
        .on("pointerenter focus", (event, model) => {
            d3.select(event.currentTarget.closest(".tensor-plane")).classed("is-reading", true);
            const mark = d3.select(event.currentTarget);
            mark.raise().attr("transform", `${event.currentTarget.dataset.baseTransform} scale(${model.id === state.selectedId ? 1.8 : 1.35})`);
            tooltip.html(tensorTooltipHtml(model, metric, plane)).attr("hidden", null);
            moveTooltip(event);
        })
        .on("pointermove", moveTooltip)
        .on("pointerleave", event => {
            if (document.activeElement === event.currentTarget) return;
            d3.select(event.currentTarget.closest(".tensor-plane")).classed("is-reading", false);
            const model = event.currentTarget.__data__;
            d3.select(event.currentTarget).attr("transform", `${event.currentTarget.dataset.baseTransform}${model.id === state.selectedId ? " scale(1.65)" : ""}`);
            hideTooltip();
        })
        .on("blur", event => {
            d3.select(event.currentTarget.closest(".tensor-plane")).classed("is-reading", false);
            const model = event.currentTarget.__data__;
            d3.select(event.currentTarget).attr("transform", `${event.currentTarget.dataset.baseTransform}${model.id === state.selectedId ? " scale(1.65)" : ""}`);
            hideTooltip();
        })
        .on("click keydown", (event, model) => {
            if (event.type === "click" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectModel(model.id);
            }
        });
}

function updateChannelControls() {
    d3.selectAll(".channel-button")
        .attr("aria-pressed", function() { return this.dataset.plane === state.activePlane ? "true" : "false"; });
}

function tensorPlaneTransform(plane, isActive) {
    if (isActive) return "translate(90,110) scale(1.04)";
    return `translate(${plane.offset.x},${plane.offset.y})`;
}

function layoutTensorMarks(plane, x, innerWidth, innerHeight) {
    const nodes = plane.models.map(model => ({
        model,
        radius: markerSize(model),
        anchorX: x(model.date),
        anchorY: plane.y(plane.yPosition(model)),
        x: x(model.date),
        y: plane.y(plane.yPosition(model))
    }));
    const categorical = plane.id !== "overall";
    const simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX(node => node.anchorX).strength(categorical ? .17 : .3))
        .force("y", d3.forceY(node => node.anchorY).strength(categorical ? .92 : .42))
        .force("collide", d3.forceCollide(node => node.radius + 3).strength(1).iterations(4))
        .stop();

    for (let tick = 0; tick < 180; tick += 1) simulation.tick();
    nodes.forEach(node => {
        const padding = node.radius + 2;
        node.x = Math.max(padding, Math.min(innerWidth - padding, node.x));
        node.y = Math.max(padding, Math.min(innerHeight - padding, node.y));
    });
    return new Map(nodes.map(node => [node.model.id, node]));
}

function applyActivePlaneState(animate = true) {
    updateChannelControls();
    const chart = d3.select("#tensor-chart").classed("has-active", Boolean(state.activePlane));
    const groups = d3.select("#tensor-chart").selectAll(".tensor-plane")
        .classed("is-active", plane => plane.id === state.activePlane)
        .classed("is-inactive", plane => Boolean(state.activePlane) && plane.id !== state.activePlane)
        .classed("is-stacked", () => !state.activePlane);

    if (state.activePlane) {
        groups.filter(plane => plane.id === state.activePlane).raise();
        const chartNode = chart.node();
        if (chartNode) chartNode.scrollTo({left: 0, behavior: animate ? "smooth" : "auto"});
    }

    groups.select(".plane-surface")
        .attr("aria-label", plane => `${plane.label} channel, ${plane.id === state.activePlane ? "currently in front" : "select to bring to front"}`)
        .attr("aria-pressed", plane => plane.id === state.activePlane ? "true" : "false");
    groups.select(".plane-count")
        .text(plane => plane.id === state.activePlane ? `${plane.models.length} models · in front` : `${plane.models.length} models`);
    groups.selectAll(".tensor-mark")
        .attr("tabindex", function() { return this.closest(".tensor-plane").dataset.plane === state.activePlane ? 0 : -1; })
        .attr("aria-hidden", function() { return this.closest(".tensor-plane").dataset.plane === state.activePlane ? null : "true"; });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate && !reducedMotion) {
        groups.interrupt().transition().duration(560).ease(d3.easeCubicInOut)
            .attr("transform", plane => tensorPlaneTransform(plane, plane.id === state.activePlane));
    } else {
        groups.attr("transform", plane => tensorPlaneTransform(plane, plane.id === state.activePlane));
    }
}

function activatePlane(id) {
    if (!id) return;
    if (id === state.activePlane) return;
    state.activePlane = id;
    applyActivePlaneState(true);
}

function renderTensorChart() {
    const metricId = d3.select("#metric-select").property("value");
    const metric = state.data.metrics.find(item => item.id === metricId);
    const scoreModels = state.models.filter(model => model.scores[metricId] != null);
    const languageCategories = categoryOrder(state.models, "language_family");
    const visionCategories = categoryOrder(state.models, "vision_family");
    const scoreExtent = d3.extent(scoreModels, model => model.scores[metricId]);
    const scorePad = Math.max((scoreExtent[1] - scoreExtent[0]) * .07, 1);
    const container = d3.select("#tensor-chart");
    container.selectAll("*").remove();

    const width = 2200;
    const height = 930;
    const planeWidth = 980;
    const planeHeight = 700;
    const margin = {top: 68, right: 30, bottom: 64, left: 100};
    const innerWidth = planeWidth - margin.left - margin.right;
    const innerHeight = planeHeight - margin.top - margin.bottom;
    const x = d3.scaleUtc().domain(dateDomain(state.models)).range([0, innerWidth]);
    const symbol = d3.symbol()
        .type(model => model.open_weight ? d3.symbolCircle : d3.symbolDiamond)
        .size(model => {
            const radius = markerSize(model);
            return Math.PI * radius * radius * .56;
        });

    const planes = [
        {
            id: "overall",
            label: "Overall",
            number: "01",
            color: "#e88a42",
            offset: {x: 300, y: 200},
            models: scoreModels,
            y: d3.scaleLinear().domain([scoreExtent[0] - scorePad, scoreExtent[1] + scorePad]).nice().range([innerHeight, 0]),
            yAxis: scale => d3.axisLeft(scale).ticks(5),
            yLabel: `${metric.label} (${metric.unit})`,
            yPosition: model => model.scores[metricId]
        },
        {
            id: "language",
            label: "Language",
            number: "02",
            color: "#c95b95",
            offset: {x: 600, y: 110},
            models: state.models,
            y: d3.scalePoint().domain(languageCategories).range([innerHeight, 0]).padding(.38),
            yAxis: scale => d3.axisLeft(scale).tickSize(0),
            yLabel: "Language family",
            yPosition: model => model.language_family
        },
        {
            id: "vision",
            label: "Vision",
            number: "03",
            color: "#2b9fb4",
            offset: {x: 900, y: 20},
            models: state.models,
            y: d3.scalePoint().domain(visionCategories).range([innerHeight, 0]).padding(.38),
            yAxis: scale => d3.axisLeft(scale).tickSize(0),
            yLabel: "Vision family",
            yPosition: model => model.vision_family
        }
    ];

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("aria-label", "Stacked tensor visualization with Overall, Language, and Vision scatterplot planes");
    const defs = svg.append("defs");

    planes.forEach(plane => {
        const isActive = plane.id === state.activePlane;
        plane.layout = layoutTensorMarks(plane, x, innerWidth, innerHeight);
        defs.append("clipPath").attr("id", `clip-${plane.id}`)
            .append("rect").attr("width", innerWidth).attr("height", innerHeight);
        const group = svg.append("g").datum(plane).attr("class", `tensor-plane plane-${plane.id}`)
            .classed("is-active", isActive)
            .classed("is-inactive", Boolean(state.activePlane) && !isActive)
            .classed("is-stacked", !state.activePlane)
            .attr("data-plane", plane.id)
            .attr("transform", tensorPlaneTransform(plane, isActive));

        group.append("polygon").attr("class", "plane-top")
            .attr("points", `0,0 12,-10 ${planeWidth + 12},-10 ${planeWidth},0`)
            .attr("fill", plane.color);
        group.append("polygon").attr("class", "plane-side")
            .attr("points", `${planeWidth},0 ${planeWidth + 12},-10 ${planeWidth + 12},${planeHeight - 10} ${planeWidth},${planeHeight}`)
            .attr("fill", plane.color);
        group.append("rect").attr("class", "plane-surface")
            .attr("width", planeWidth).attr("height", planeHeight)
            .attr("fill", "#ebe8df").attr("stroke", plane.color)
            .attr("tabindex", 0).attr("role", "button")
            .attr("aria-label", `${plane.label} channel, ${isActive ? "currently in front" : "select to bring to front"}`)
            .attr("aria-pressed", isActive ? "true" : "false")
            .on("click keydown", event => {
                if (event.type === "click" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activatePlane(plane.id);
                }
            });
        group.append("rect").attr("class", "plane-accent")
            .attr("width", 7).attr("height", planeHeight).attr("fill", plane.color);
        group.append("text").attr("class", "plane-number").attr("x", 18).attr("y", 30).text(plane.number);
        group.append("text").attr("class", "plane-label").attr("x", 50).attr("y", 30).text(plane.label);
        group.append("text").attr("class", "plane-count").attr("x", planeWidth - 18).attr("y", 30)
            .attr("text-anchor", "end").text(isActive ? `${plane.models.length} models · in front` : `${plane.models.length} models`);

        const plot = group.append("g").attr("class", "plane-plot")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        plot.append("g").attr("class", "tensor-grid")
            .call(d3.axisLeft(plane.y).tickSize(-innerWidth).tickFormat(""));
        plot.append("g").attr("class", "tensor-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(4).tickFormat(d3.utcFormat("%Y")));
        plot.append("g").attr("class", "tensor-axis tensor-y-axis")
            .call(plane.yAxis(plane.y).tickPadding(8));
        plot.append("text").attr("class", "tensor-axis-title")
            .attr("x", innerWidth / 2).attr("y", innerHeight + 39).attr("text-anchor", "middle").text("Release time");
        plot.append("text").attr("class", "tensor-axis-title")
            .attr("transform", "rotate(-90)").attr("x", -innerHeight / 2).attr("y", -112)
            .attr("text-anchor", "middle").text(plane.yLabel);

        const marks = plot.append("g").attr("class", "tensor-marks").attr("clip-path", `url(#clip-${plane.id})`)
            .selectAll("path").data(plane.models, model => model.id).join("path")
            .attr("class", model => `tensor-mark${model.id === state.selectedId ? " is-selected" : ""}`)
            .attr("d", symbol)
            .attr("transform", model => {
                const position = plane.layout.get(model.id);
                const base = `translate(${position.x},${position.y})`;
                return `${base}${model.id === state.selectedId ? " scale(1.65)" : ""}`;
            })
            .attr("fill", model => model.open_weight ? state.color(model.organization_group) : "#fffdf8")
            .attr("stroke", model => model.id === state.selectedId ? "#17231d" : state.color(model.organization_group))
            .attr("stroke-width", model => model.id === state.selectedId ? 3.5 : 1.4)
            .attr("opacity", model => state.selectedId && model.id !== state.selectedId ? .42 : .88)
            .each(function() {
                const transform = this.getAttribute("transform") || "";
                this.dataset.baseTransform = transform.replace(/ scale\([^)]*\)$/, "");
            });
        marks.filter(model => model.id === state.selectedId).raise();
        marks.append("title").text(model => `${model.name} · ${plane.label}`);
        bindTensorMarks(marks, metric, plane, isActive);

        const selectedModel = plane.models.find(model => model.id === state.selectedId);
        if (selectedModel) {
            const selectedPosition = plane.layout.get(selectedModel.id);
            const selectedX = selectedPosition.x;
            const selectedY = selectedPosition.y;
            const labelOnLeft = selectedX > innerWidth - 120;
            const callout = plot.append("g").attr("class", "tensor-selection-callout").attr("pointer-events", "none");
            callout.append("circle").attr("class", "tensor-selection-halo")
                .attr("cx", selectedX).attr("cy", selectedY).attr("r", markerSize(selectedModel) + 8);
            callout.append("text").attr("class", "tensor-selection-label")
                .attr("x", selectedX + (labelOnLeft ? -13 : 13))
                .attr("y", Math.max(14, Math.min(innerHeight - 8, selectedY - 13)))
                .attr("text-anchor", labelOnLeft ? "end" : "start")
                .text(selectedModel.name);
        }
    });

    applyActivePlaneState(false);

    d3.select("#metric-coverage").text(`${scoreModels.length} of ${state.models.length} dated models have this score`);
}

function updateSelectedModel() {
    const model = state.modelsById.get(state.selectedId);
    const container = d3.select("#selected-model");
    if (!model) {
        container.html("<strong>No model selected.</strong><span>Choose a point or use the model dropdown to compare one model across all three planes.</span>");
        return;
    }
    const metric = state.data.metrics.find(item => item.id === d3.select("#metric-select").property("value"));
    const score = model.scores[metric.id] == null ? "not available" : `${model.scores[metric.id]} ${metric.unit}`;
    container.html(`<strong>${escapeHtml(model.name)}</strong><span>${escapeHtml(model.organization)} · ${escapeHtml(formatDate(model.date))} · ${escapeHtml(model.parameters_label)} · ${escapeHtml(metric.label)}: ${escapeHtml(score)} · ${model.open_weight ? "Open-weight" : "Closed or undisclosed weights"}</span>`);
}

function selectModel(id) {
    state.selectedId = id || null;
    d3.select("#model-select").property("value", state.selectedId ?? "");
    updateSelectedModel();
    renderTensorChart();
}

function renderParameterChart() {
    const models = state.models.filter(d => d.parameters_b != null && d.parameters_b > 0);
    const frame = chartFrame("#parameter-chart", 430, 80);
    const x = d3.scaleUtc().domain(dateDomain(models)).range([0, frame.innerWidth]);
    const y = d3.scaleLog().domain(d3.extent(models, d => d.parameters_b)).nice().range([frame.innerHeight, 0]);
    addAxes(frame, x, y, "Release date", "Reported parameters (billions, log scale)", 5);
    const marks = frame.plot.append("g").selectAll("circle").data(models, d => d.id).join("circle")
        .attr("cx", d => x(d.date) + hashJitter(d.id, 2.5)).attr("cy", d => y(d.parameters_b))
        .attr("r", 5).attr("fill", pointFill).attr("stroke", pointStroke).attr("stroke-width", 1.5).attr("opacity", .72);
    bindMarks(marks);
    frame.plot.append("text").attr("class", "annotation").attr("x", frame.innerWidth).attr("y", 8).attr("text-anchor", "end")
        .text(`${models.length} models with reported size`);
}

function renderNetwork() {
    const frame = chartFrame("#network-chart", 570, 24, 760);
    frame.svg.style("min-width", "760px");
    const network = state.data.network;
    const providerNodes = network.nodes.filter(d => d.type === "provider");
    const familyNodes = network.nodes.filter(d => d.type === "family");
    const nodes = network.nodes.map(d => ({...d}));
    const byId = new Map(nodes.map(d => [d.id, d]));
    const providerY = d3.scalePoint().domain(providerNodes.map(d => d.id)).range([40, frame.innerHeight - 20]).padding(.5);
    const familyY = d3.scalePoint().domain(familyNodes.map(d => d.id)).range([20, frame.innerHeight]).padding(.4);
    nodes.forEach(node => {
        node.x = node.type === "provider" ? frame.innerWidth * .18 : frame.innerWidth * .73;
        node.y = node.type === "provider" ? providerY(node.id) : familyY(node.id);
    });
    const width = d3.scaleLinear().domain([1, d3.max(network.links, d => d.count)]).range([1, 8]);
    const links = frame.plot.append("g").selectAll("path").data(network.links).join("path")
        .attr("class", "network-link")
        .attr("stroke-width", d => width(d.count))
        .attr("d", d => {
            const s = byId.get(d.source), t = byId.get(d.target), mid = (s.x + t.x) / 2;
            return `M${s.x},${s.y} C${mid},${s.y} ${mid},${t.y} ${t.x},${t.y}`;
        });
    const node = frame.plot.append("g").selectAll("g").data(nodes).join("g")
        .attr("class", "network-node").attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("tabindex", 0).attr("role", "button").attr("aria-label", d => `${d.type}: ${d.label}, ${d.count} records`);
    node.append("circle").attr("r", d => 5 + Math.sqrt(d.count)).attr("fill", d => d.type === "provider" ? "#135b43" : "#dc6d35");
    node.append("text").attr("x", d => d.type === "provider" ? -12 : 12).attr("dy", ".35em")
        .attr("text-anchor", d => d.type === "provider" ? "end" : "start").text(d => d.label);
    const setActive = active => {
        if (!active) { node.classed("is-muted", false).classed("is-active", false); links.classed("is-muted", false); return; }
        const connected = new Set([active.id]);
        network.links.forEach(link => {
            if (link.source === active.id) connected.add(link.target);
            if (link.target === active.id) connected.add(link.source);
        });
        node.classed("is-muted", d => !connected.has(d.id)).classed("is-active", d => d.id === active.id);
        links.classed("is-muted", d => d.source !== active.id && d.target !== active.id);
    };
    node.on("pointerenter focus", (event, d) => {
        setActive(d);
        tooltip.html(`<strong>${escapeHtml(d.label)}</strong>${d.count} model records in this summarized network`).attr("hidden", null);
        moveTooltip(event);
    }).on("pointermove", moveTooltip).on("pointerleave blur", () => { setActive(null); hideTooltip(); });
    frame.plot.append("text").attr("class", "axis-title").attr("x", frame.innerWidth * .18).attr("y", 8).attr("text-anchor", "middle").text("Provider");
    frame.plot.append("text").attr("class", "axis-title").attr("x", frame.innerWidth * .73).attr("y", 8).attr("text-anchor", "middle").text("Model family");
}

function renderLegend() {
    d3.select("#provider-legend").selectAll("span").data(state.data.organization_groups).join("span")
        .attr("class", "legend-item")
        .html(d => `<i class="swatch" style="background:${state.color(d)}"></i>${escapeHtml(d)}`);
}

function updateStats(profile) {
    d3.select("#stat-models").text(d3.format(",")(profile.model_records));
    d3.select("#stat-open").text(d3.format(",")(profile.open_weight_models));
    d3.select("#stat-blocks").text(d3.format(",")(profile.benchmark_blocks));
    d3.select("#stat-values").text(d3.format(",")(profile.numeric_measurements));
    d3.select("#date-window").text(`${formatMonth(parseDate(profile.date_min))} to ${formatMonth(parseDate(profile.date_max))}`);
}

function renderAll() {
    renderTensorChart();
    renderParameterChart();
    renderNetwork();
}

d3.json("data/interim_models.json").then(data => {
    const models = data.models.filter(d => d.release_date).map(d => ({...d, date: parseDate(d.release_date)}));
    state = {
        data,
        models,
        modelsById: new Map(models.map(model => [model.id, model])),
        selectedId: null,
        activePlane: null,
        color: d3.scaleOrdinal(data.organization_groups, COLORS)
    };
    const select = d3.select("#metric-select");
    select.selectAll("option").data(data.metrics).join("option").attr("value", d => d.id).text(d => d.label);
    select.property("value", "mmmu").on("change", () => {
        updateSelectedModel();
        renderTensorChart();
    });
    const modelSelect = d3.select("#model-select");
    const sortedModels = [...models].sort((a, b) => d3.ascending(a.name, b.name));
    modelSelect.selectAll("option.model-option").data(sortedModels, model => model.id).join("option")
        .attr("class", "model-option")
        .attr("value", model => model.id)
        .text(model => `${model.name} — ${model.organization}`);
    modelSelect.on("change", event => selectModel(event.target.value));
    d3.select("#clear-selection").on("click", () => selectModel(null));
    d3.selectAll(".channel-button").on("click", function() { activatePlane(this.dataset.plane); });
    updateChannelControls();
    updateStats(data.profile);
    renderLegend();
    renderAll();
    let previousWidth = document.querySelector("#visualizations").clientWidth;
    const redraw = new ResizeObserver(entries => {
        const nextWidth = entries[0].contentRect.width;
        if (Math.abs(nextWidth - previousWidth) < 2) return;
        previousWidth = nextWidth;
        window.clearTimeout(state.resizeTimer);
        state.resizeTimer = window.setTimeout(() => {
            renderTensorChart();
            renderParameterChart();
            renderNetwork();
        }, 120);
    });
    redraw.observe(document.querySelector("#visualizations"));
}).catch(error => {
    console.error(error);
    d3.select("#visualizations").insert("p", ":first-child").attr("class", "load-error")
        .text("The processed dataset could not be loaded. Serve this folder through a local HTTP server and rebuild the data if needed.");
});
