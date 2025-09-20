import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SupabaseService } from '@/services/supabaseService';

type QueueOperation = 'add' | 'update' | 'delete';

interface QueueItem {
  id: string;
  op: QueueOperation;
  payload: any;
  createdAt: number;
}

const QUEUE_KEY = 'ts:queue';

export class OfflineQueue {
  private static isProcessing = false;

  static async enqueue(item: Omit<QueueItem, 'createdAt'>): Promise<void> {
    try {
      const queueItem: QueueItem = {
        ...item,
        createdAt: Date.now(),
      };
      
      const existingQueue = await this.peekAll();
      const updatedQueue = [...existingQueue, queueItem];
      
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log('Enqueued operation:', item.op, item.id);
    } catch (error) {
      console.error('Error enqueuing item:', error);
    }
  }

  static async dequeue(id: string): Promise<void> {
    try {
      const queue = await this.peekAll();
      const updatedQueue = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log('Dequeued operation:', id);
    } catch (error) {
      console.error('Error dequeuing item:', error);
    }
  }

  static async peekAll(): Promise<QueueItem[]> {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error reading queue:', error);
      return [];
    }
  }

  static async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress');
      return;
    }

    try {
      this.isProcessing = true;
      const queue = await this.peekAll();
      
      if (queue.length === 0) {
        console.log('Queue is empty');
        return;
      }

      console.log(`Processing ${queue.length} queued operations`);
      
      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          await this.dequeue(item.id);
          console.log(`Successfully processed ${item.op} operation for ${item.id}`);
        } catch (error) {
          console.error(`Failed to process ${item.op} operation for ${item.id}:`, error);
          // Stop processing on first failure to maintain order
          break;
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private static async processQueueItem(item: QueueItem): Promise<void> {
    const { op, payload } = item;
    
    switch (op) {
      case 'add':
        await SupabaseService.addEntry(payload);
        break;
      case 'update':
        await SupabaseService.updateEntry(payload.id, payload.updates);
        break;
      case 'delete':
        await SupabaseService.deleteEntry(payload.id);
        break;
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  static startNetworkListener(): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state.isInternetReachable);
      if (state.isInternetReachable) {
        // Small delay to ensure connection is stable
        setTimeout(() => {
          this.processQueue();
        }, 1000);
      }
    });

    // Process queue on startup if online
    NetInfo.fetch().then(state => {
      if (state.isInternetReachable) {
        this.processQueue();
      }
    });

    return unsubscribe;
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
      console.log('Queue cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }
}