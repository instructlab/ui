// src/utils/taxonomy.ts
interface TaxonomyDownloadProp {
  branchName: string;
  setIsDownloadDone: (isDownloadDone: boolean) => void;
}
export async function handleTaxonomyDownload({ branchName, setIsDownloadDone }: TaxonomyDownloadProp) {
  const res = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branchName: branchName
    })
  });

  if (!res.ok) {
    alert('Failed to download the taxonomy');
    return { message: res.statusText, status: res.status };
  }

  setIsDownloadDone(true);

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taxonomy-${branchName}.tar.gz`;
  a.click();
  window.URL.revokeObjectURL(url);
}
