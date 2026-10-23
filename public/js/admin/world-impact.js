// Count actual lost assignments; direct assignments survive category changes.
export function categoryWorldRemovalImpact(category, nextWorldIds, questions) {
    const next = new Set(nextWorldIds);
    const removedWorldIds = (category?.worldIds || []).filter(id => !next.has(id));
    const affected = questions.filter(question => question.categoryId === category?.id
        && removedWorldIds.some(id => !(question.directWorldIds || []).includes(id)));
    const unassignedCount = affected.filter(question => next.size === 0
        && (question.directWorldIds || []).length === 0).length;
    return { removedWorldIds, affectedCount: affected.length, unassignedCount };
}
