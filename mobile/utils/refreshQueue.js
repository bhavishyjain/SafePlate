let activeRefresh = null;

export function runSingleRefresh(refresh) {
  if (!activeRefresh) activeRefresh = Promise.resolve().then(refresh).finally(() => { activeRefresh = null; });
  return activeRefresh;
}

