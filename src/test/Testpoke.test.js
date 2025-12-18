import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

/**
 * Archivo de pruebas: `Testpoke.test.js`
 */

const pushMock = vi.fn();
vi.mock('../router/shim', () => ({
  useRoute: () => ({ value: { params: { id: '1' } } }),
  useRouter: () => ({ push: pushMock })
}));

import HomeView from '../views/HomeView.vue';
import PokemonDetail from '../views/PokemonDetail.vue';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('HomeView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try { delete global.fetch; } catch (e) {}
  });

  const mockHomeFetch = () => {
    global.fetch.mockImplementation((url) => {
      const s = String(url);

      // 1ª llamada: lista
      if (s.includes('?offset')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            results: [
              
              { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }
            ]
          })
        });
      }

      // 2ª llamada: detalle rápido para la tarjeta
      if (s.includes('/pokemon/1')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            sprites: { front_default: 'http://img.local/bulbasaur.png' }
          })
        });
      }

      return Promise.reject(new Error('unexpected fetch ' + url));
    });
  };

  it('fetches pokemons from API', async () => {
    expect.assertions(2);
    mockHomeFetch();

    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Se ha llamado al menos una vez
    expect(global.fetch).toHaveBeenCalled();

    // Y la primera llamada ha sido a la lista con offset
    const firstCallUrl = global.fetch.mock.calls[0][0];
    expect(String(firstCallUrl)).toContain('?offset=');
  });

  it('renders pokemon boxes with images', async () => {
    expect.assertions(3);
    mockHomeFetch();

    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Comprobamos que se ha pedido el detalle del pokemon 1,
    // si cambias el url de results a /pokemon/2/ este expect fallará
    const calledUrls = global.fetch.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.endsWith('/pokemon/1'))).toBe(true);

    const imgs = wrapper.findAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].attributes('src')).toBe('http://img.local/bulbasaur.png');
  });

  it('displays pokemon number and name texts', async () => {
    expect.assertions(1);
    mockHomeFetch();

    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Si en tu componente el número lo sacas del id de la URL,
    // al cambiar /pokemon/1/ por /pokemon/2/ esto dejará de ser "1 bulbasaur"
    expect(wrapper.text().toLowerCase()).toContain('1 bulbasaur');
  });
});

describe('PokemonDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try { delete global.fetch; } catch (e) {}
  });

  const mockDetailFetch = () => {
    global.fetch.mockImplementation((url) => {
      const s = String(url);

      if (s.endsWith('/pokemon/1')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            id: 1,
            name: 'bulbasaur',
            sprites: {
              front_default: 'http://img.local/front.png',
              back_default: 'http://img.local/back.png',
              other: { 'official-artwork': { front_default: 'http://img.local/art.png' } }
            },
            types: [{ slot: 1, type: { name: 'grass' } }],
            abilities: [{ ability: { name: 'overgrow' } }],
            stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
            moves: [
              { move: { name: 'tackle' } },
              { move: { name: 'vine-whip' } },
              { move: { name: 'razor-leaf' } }
            ],
            species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
          })
        });
      }

      if (s.includes('/pokemon-species/1')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            flavor_text_entries: [
              { language: { name: 'es' }, flavor_text: 'Texto en español' }
            ]
          })
        });
      }

      return Promise.reject(new Error('unexpected fetch ' + url));
    });
  };

  it('loads pokemon detail from API', async () => {
    expect.assertions(1);
    mockDetailFetch();

    const wrapper = mount(PokemonDetail);
    await flushPromises();
    await wrapper.vm.$nextTick();

    // Si el componente cambia el id (por ejemplo usa 2), este expect fallará
    expect(global.fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/1');
  });

  it('displays pokemon sprites', async () => {
    expect.assertions(1);
    mockDetailFetch();

    const wrapper = mount(PokemonDetail);
    await flushPromises();
    await wrapper.vm.$nextTick();

    const imgs = wrapper.findAll('img');
    const srcs = imgs.map((i) => i.attributes('src'));
    expect(srcs).toEqual(expect.arrayContaining([
      'http://img.local/front.png',
      'http://img.local/back.png',
      'http://img.local/art.png'
    ]));
  });

  it('displays pokemon description', async () => {
    expect.assertions(1);
    mockDetailFetch();

    const wrapper = mount(PokemonDetail);
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Texto en español');
  });

  it('displays pokemon moves', async () => {
    expect.assertions(1);
    mockDetailFetch();

    const wrapper = mount(PokemonDetail);
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('tackle');
  });

  it('displays pokemon key texts (name, types, abilities, stats)', async () => {
    expect.assertions(6);
    mockDetailFetch();

    const wrapper = mount(PokemonDetail);
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Bulbasaur');
    expect(wrapper.text()).toContain('grass');
    expect(wrapper.text()).toContain('overgrow');
    expect(wrapper.text()).toContain('hp');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('#1');
  });

  it('goBack button navigates to home', async () => {
    expect.assertions(1);
    mockDetailFetch();

    const wrapper = mount(PokemonDetail);
    await flushPromises();
    await wrapper.vm.$nextTick();

    const back = wrapper.find('button.back-button');
    await back.trigger('click');
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
