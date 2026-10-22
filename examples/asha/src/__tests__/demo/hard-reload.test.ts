import { hardReloadPage } from '@/demo/identify-demo-guest';

describe('hardReloadPage', () => {
  it('starts a fresh GET navigation with a new cache-busting query', () => {
    const submit = jest
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => undefined);

    hardReloadPage();
    hardReloadPage();

    expect(submit).toHaveBeenCalledTimes(2);
    const first = submit.mock.instances[0] as HTMLFormElement;
    const second = submit.mock.instances[1] as HTMLFormElement;
    const firstReload = new FormData(first).get('guestReload');
    const secondReload = new FormData(second).get('guestReload');

    expect(first.method).toBe('get');
    expect(firstReload).toEqual(expect.any(String));
    expect(secondReload).toEqual(expect.any(String));
    expect(secondReload).not.toBe(firstReload);

    submit.mockRestore();
  });
});
