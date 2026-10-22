import { hardReloadPage } from '@/demo/identify-demo-guest';

describe('hardReloadPage', () => {
  it('starts a fresh GET navigation with a new cache-busting query', () => {
    const submit = jest
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => undefined);

    hardReloadPage();
    hardReloadPage();

    expect(submit).toHaveBeenCalledTimes(2);
    const forms = Array.from(document.body.querySelectorAll('form'));
    const firstReload = new FormData(forms[0]).get('guestReload');
    const secondReload = new FormData(forms[1]).get('guestReload');

    expect(forms[0].method).toBe('get');
    expect(firstReload).toEqual(expect.any(String));
    expect(secondReload).toEqual(expect.any(String));
    expect(secondReload).not.toBe(firstReload);

    submit.mockRestore();
  });
});
