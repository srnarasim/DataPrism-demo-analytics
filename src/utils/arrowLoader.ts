/**
 * Apache Arrow Loader Utility
 * Ensures Apache Arrow is available for DataPrism initialization
 */

import * as Arrow from 'apache-arrow';

declare global {
  interface Window {
    Arrow: typeof Arrow;
  }
}

export class ArrowLoader {
  private static instance: ArrowLoader;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  static getInstance(): ArrowLoader {
    if (!ArrowLoader.instance) {
      ArrowLoader.instance = new ArrowLoader();
    }
    return ArrowLoader.instance;
  }

  async ensureArrowLoaded(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadArrow();
    return this.loadPromise;
  }

  private async loadArrow(): Promise<void> {
    try {
      console.log('📦 Loading Apache Arrow from local bundle (v17.0.0)...');
      
      // Make Arrow available globally for DataPrism
      (window as any).Arrow = Arrow;
      
      // Test that Arrow is working
      const testData = [1, 2, 3, 4, 5];
      const vector = Arrow.vectorFromArray(testData);
      
      if (vector.length !== testData.length) {
        throw new Error('Arrow vector creation test failed');
      }
      
      console.log('✅ Apache Arrow loaded successfully from local bundle');
      this.isLoaded = true;
      
    } catch (error) {
      console.error('❌ Failed to load Apache Arrow:', error);
      throw error;
    }
  }

  isArrowReady(): boolean {
    return this.isLoaded && typeof (window as any).Arrow !== 'undefined';
  }

  getArrowVersion(): string {
    return '17.0.0';
  }
}

export const arrowLoader = ArrowLoader.getInstance();