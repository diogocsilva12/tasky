import { describe, it, expect } from 'vitest';
import { cleanRepoName, cleanRepoOwner, getCleanRepoDetails } from '../lib/githubUrl';

describe('githubUrl helpers', () => {
  it('cleans repo names with .git suffix', () => {
    expect(cleanRepoName('mca-uminho.git')).toBe('mca-uminho');
    expect(cleanRepoName('tasky/')).toBe('tasky');
    expect(cleanRepoName('https://github.com/diogocsilva12/mca-uminho.git')).toBe('mca-uminho');
  });

  it('cleans repo owners', () => {
    expect(cleanRepoOwner('@diogocsilva12')).toBe('diogocsilva12');
    expect(cleanRepoOwner('https://github.com/diogocsilva12/repo')).toBe('diogocsilva12');
  });

  it('generates proper repoUrl without .git and without /tree/main', () => {
    const details = getCleanRepoDetails({
      repoOwner: 'diogocsilva12',
      repoName: 'mca-uminho.git',
      defaultBranch: 'main',
    });

    expect(details.repoUrl).toBe('https://github.com/diogocsilva12/mca-uminho');
    expect(details.branchUrl()).toBe('https://github.com/diogocsilva12/mca-uminho/tree/main');
    expect(details.issueUrl(42)).toBe('https://github.com/diogocsilva12/mca-uminho/issues/42');
  });

  it('handles githubUrl with .git correctly', () => {
    const details = getCleanRepoDetails({
      githubUrl: 'https://github.com/diogocsilva12/mca-uminho.git',
      defaultBranch: 'main',
    });

    expect(details.owner).toBe('diogocsilva12');
    expect(details.name).toBe('mca-uminho');
    expect(details.repoUrl).toBe('https://github.com/diogocsilva12/mca-uminho');
    expect(details.branchUrl()).toBe('https://github.com/diogocsilva12/mca-uminho/tree/main');
  });
});
