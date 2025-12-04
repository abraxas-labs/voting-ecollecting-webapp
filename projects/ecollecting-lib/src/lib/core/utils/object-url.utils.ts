/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Observable } from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';

export function newObjectUrlObservableForBlob(input: Blob): Observable<SafeResourceUrl> {
  return new Observable<SafeResourceUrl>(observer => {
    const objUrl = URL.createObjectURL(input);

    // do not complete the observable,
    // but wait for the unsubscribe event of the caller
    // this allows us to revoke the object url on unsubscription of the caller
    observer.next(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  });
}

export function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  window.addEventListener('unload', () => URL.revokeObjectURL(url));
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
