/* Task-view calculations shared by the browser and Node regression checks. */
'use strict';
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaskEvidence = factory();
})(typeof globalThis === 'object' ? globalThis : this, function() {
  const experienceTypes = new Set(['actual_experience', 'actual', 'reported_experience', 'experience', 'usage_observation', 'problem_report']);
  function matches(row, filters) {
    return row.month !== 'unknown' && (!filters.from || row.month >= filters.from) &&
      (!filters.to || row.month <= filters.to) &&
      (!filters.family || filters.family === 'all' || row.family_id === filters.family) &&
      (!filters.platform || filters.platform === 'all' || row.platform === filters.platform);
  }
  function summarize(data, filters) {
    const profiles = (data.tasks || []).map(task => ({...task, count:0, experience:0, validated:0, rows:[]}));
    const byId = new Map(profiles.map(task => [task.id, task]));
    let denominator = 0;
    for (const row of data.feedback_totals || []) if (matches(row, filters)) denominator += Number(row.count) || 0;
    // Only all-scope buckets count task records. Model and family buckets repeat them.
    for (const row of data.feedback_buckets || []) {
      const profile = byId.get(row.task_id);
      if (!profile || row.scope !== 'all' || !matches(row, filters)) continue;
      profile.count += Number(row.count) || 0;
      profile.experience += Number(row.actual_experience_count) || 0;
      profile.validated += Number(row.validated_count) || 0;
      profile.rows.push(row);
    }
    return {denominator, profiles};
  }
  function rank(profiles, {measure='count', mapping='all', sort='count'} = {}) {
    return profiles.filter(task => mapping === 'all' || Boolean(task.benchmark_ids?.length) === (mapping === 'mapped'))
      .sort((a, b) => (sort === 'name' ? 0 : b[measure] - a[measure]) || a.label.localeCompare(b.label));
  }
  function sample(rows, lookup, experienceOnly=false) {
    const snippets = new Map();
    for (const row of rows) for (const id of row.excerpt_ids || []) {
      const excerpt = lookup[id];
      if (!excerpt || !excerpt.source_url || (experienceOnly && !experienceTypes.has(String(excerpt.experience_type).toLowerCase()))) continue;
      snippets.set(id, excerpt);
    }
    return [...snippets.values()].sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')) || a.id.localeCompare(b.id));
  }
  return {summarize, rank, sample};
});
