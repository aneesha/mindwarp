import { saveAs } from 'file-saver';
import type { MindMap } from '../core/MindMap';
import { MindMap as MindMapClass } from '../core/MindMap';
import { validateMindMapData, migrateData } from './Serializer';

export class FileManager {
  save(mindmap: MindMap): void {
    const data = mindmap.serialize();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `${mindmap.title.replace(/[^a-zA-Z0-9]/g, '_')}.mindwarp.json`;
    saveAs(blob, filename);
  }

  load(): Promise<MindMap> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.mindwarp.json';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          if (!validateMindMapData(data)) {
            reject(new Error('Invalid mindmap file format'));
            return;
          }

          const migrated = migrateData(data);
          const mindmap = MindMapClass.deserialize(migrated);
          resolve(mindmap);
        } catch (err) {
          reject(new Error(`Failed to load file: ${err instanceof Error ? err.message : String(err)}`));
        }
      };

      input.oncancel = () => reject(new Error('File selection cancelled'));
      input.click();
    });
  }
}
