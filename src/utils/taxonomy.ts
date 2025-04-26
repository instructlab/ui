// src/utils/taxonomy.ts
const GITHUB_TAXONOMY_DOWNLOAD_URL = '/api/github/download';
const NATIVE_TAXONOMY_DOWNLOAD_URL = '/api/native/download';

interface TaxonomyDownloadProp {
  branchName: string;
  isGithubMode: boolean;
  setIsDownloadDone: (isDownloadDone: boolean) => void;
}
export async function handleTaxonomyDownload({ branchName, isGithubMode, setIsDownloadDone }: TaxonomyDownloadProp) {
  const res = await fetch(isGithubMode ? GITHUB_TAXONOMY_DOWNLOAD_URL : NATIVE_TAXONOMY_DOWNLOAD_URL, {
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
