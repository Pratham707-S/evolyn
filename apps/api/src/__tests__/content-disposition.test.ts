import assert from 'node:assert/strict';
import { validateHeaderValue } from 'node:http';
import { describe, it } from 'node:test';
import { inlineContentDisposition } from '../utils/content-disposition.js';

describe('inlineContentDisposition', () => {
  it('keeps Unicode filenames in RFC 5987 form and provides an ASCII fallback', () => {
    const header = inlineContentDisposition('TEST ONLY — env update verification.pdf');

    assert.equal(
      header,
      `inline; filename="TEST ONLY _ env update verification.pdf"; filename*=UTF-8''TEST%20ONLY%20%E2%80%94%20env%20update%20verification.pdf`
    );
    assert.doesNotThrow(() => validateHeaderValue('Content-Disposition', header));
  });

  it('replaces header-breaking and path characters', () => {
    const header = inlineContentDisposition('report\r\nX-Evil: yes/..\\draft.pdf');

    assert.equal(header, 'inline; filename="report__X-Evil_ yes_.._draft.pdf"; filename*=UTF-8\'\'report__X-Evil_%20yes_.._draft.pdf');
    assert.doesNotThrow(() => validateHeaderValue('Content-Disposition', header));
  });

  it('uses a default filename when the provided title is empty', () => {
    assert.equal(
      inlineContentDisposition(''),
      `inline; filename="document.pdf"; filename*=UTF-8''document.pdf`
    );
  });
});
