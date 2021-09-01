export interface CodexRenderer {
  marshal(object: any, indent?: number): string;
  unmarshal(content: string): any;
}
