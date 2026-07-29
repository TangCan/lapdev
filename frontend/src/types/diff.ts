export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'modified' | 'deleted';
}