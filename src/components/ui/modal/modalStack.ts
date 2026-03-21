// Modal Stack manager, used to track open Modal
// Use module-level state, no dependencies DOM API

type ModalId = symbol;

class ModalStackManager {
  private stack: ModalId[] = [];
  private listeners: Set<(stack: ModalId[]) => void> = new Set();

  // Register a new one Modal，return its ID
  register(): ModalId {
    const id = Symbol("modal");
    this.stack.push(id);
    this.notifyListeners();
    return id;
  }

  // Unregister Modal
  unregister(id: ModalId): void {
    const index = this.stack.indexOf(id);
    if (index !== -1) {
      this.stack.splice(index, 1);
      this.notifyListeners();
    }
  }

  // Check the given Modal Is it the top one?
  isTopModal(id: ModalId): boolean {
    if (this.stack.length === 0) return false;
    return this.stack[this.stack.length - 1] === id;
  }

  // Get stack Modal quantity
  getStackSize(): number {
    return this.stack.length;
  }

  // Subscribe to stack changes (if needed)
  subscribe(listener: (stack: ModalId[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.stack]));
  }
}

export const modalStackManager = new ModalStackManager();
