// src/utils/rangeEvents.ts
export const triggerFetchCharacterStats = (tokenId: string) => {
    window.dispatchEvent(new CustomEvent('fetchCharacterStats', { detail: { tokenId } }));
  };
  
  export const onCharacterStatsFetched = (callback: (tokenId: string, stats: number[]) => void) => {
    window.addEventListener('characterStatsFetched', (e: any) => {
      const { tokenId, stats } = e.detail;
      callback(tokenId, stats);
    });
  };
  
  export const triggerCharacterStatsFetched = (tokenId: string, stats: number[]) => {
    window.dispatchEvent(new CustomEvent('characterStatsFetched', { detail: { tokenId, stats } }));
  };