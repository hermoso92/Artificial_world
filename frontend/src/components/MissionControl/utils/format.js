export function formatRelativeTime(isoString) {
  if (!isoString) {
    return 'sin registro';
  }

  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatDateTime(isoString) {
  if (!isoString) {
    return 'sin fecha';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(isoString));
}

export function formatDuration(ms) {
  if (!ms) {
    return '0s';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours === 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${hours}h ${minutes % 60}m`;
}

export function severityTone(severity) {
  switch (severity) {
    case 'error':
      return 'danger';
    case 'warn':
      return 'warning';
    default:
      return 'info';
  }
}

export function statusTone(status) {
  switch (status) {
    case 'connected':
    case 'done':
    case 'approved':
    case 'active':
    case 'running':
      return 'success';
    case 'review':
    case 'waiting_approval':
      return 'warning';
    case 'blocked':
    case 'failed':
    case 'error':
    case 'rejected':
    case 'disconnected':
      return 'danger';
    default:
      return 'neutral';
  }
}
