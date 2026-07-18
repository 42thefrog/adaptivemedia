declare module "alpinejs" {
  const Alpine: {
    data(name: string, factory: () => any): void;
    start(): void;
  };
  export default Alpine;
}
