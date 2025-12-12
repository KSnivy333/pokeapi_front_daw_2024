import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

/**
 * Archivo de pruebas: `Testpoke.test.js`
 * - Contiene tests unitarios para `HomeView.vue` y `PokemonDetail.vue`.
 * - Se usan mocks para `fetch` (llamadas a la API) y para el router shim
 *   (funciones `useRoute` / `useRouter`) para controlar parámetros y navegación.
 */

// --- Mock del router shim --------------------------------------------------
// Many components import `../router/shim` to use `useRoute` / `useRouter`.
// Aquí lo mockeamos para que las pruebas no dependan del router real.
// - `useRoute` devuelve un `ref` simulado con params `{ id: '1' }`.
// - `useRouter` devuelve un objeto con `push` que podemos espiar (`pushMock`).
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

	it('fetches pokemons from API', async () => {
		// Verifica que se hace la llamada a la API para obtener la lista de pokemons
		global.fetch.mockImplementation((url) => {
			if (String(url).includes('?offset')) {
				return Promise.resolve({ json: () => Promise.resolve({ results: [ { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' } ] }) });
			}
			if (String(url).includes('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ sprites: { front_default: 'http://img.local/bulbasaur.png' } }) });
			}
			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(HomeView, { global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } } });
		await flushPromises();
		await wrapper.vm.$nextTick();

		expect(global.fetch).toHaveBeenCalled();
	});

	it('renders pokemon boxes with images', async () => {
		// Verifica que se renderizan las cajas de pokemon con las imágenes correctas
		global.fetch.mockImplementation((url) => {
			if (String(url).includes('?offset')) {
				return Promise.resolve({ json: () => Promise.resolve({ results: [ { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' } ] }) });
			}
			if (String(url).includes('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ sprites: { front_default: 'http://img.local/bulbasaur.png' } }) });
			}
			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(HomeView, { global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } } });
		await flushPromises();
		await wrapper.vm.$nextTick();

		const imgs = wrapper.findAll('img');
		expect(imgs.length).toBeGreaterThan(0);
		expect(imgs[0].attributes('src')).toBe('http://img.local/bulbasaur.png');
	});

	it('displays pokemon number and name texts', async () => {
		// Verifica que se muestran los textos del número y nombre del pokemon
		global.fetch.mockImplementation((url) => {
			if (String(url).includes('?offset')) {
				return Promise.resolve({ json: () => Promise.resolve({ results: [ { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' } ] }) });
			}
			if (String(url).includes('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ sprites: { front_default: 'http://img.local/bulbasaur.png' } }) });
			}
			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(HomeView, { global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } } });
		await flushPromises();
		await wrapper.vm.$nextTick();

		// El componente renderiza `number + " " + name`, por lo que debería aparecer algo como "1 bulbasaur"
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

	it('loads pokemon detail from API', async () => {
		// Verifica que se hace la llamada a la API para obtener el detalle del pokemon
		global.fetch.mockImplementation((url) => {
			const s = String(url);
			if (s.endsWith('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({
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
					moves: [ { move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }, { move: { name: 'razor-leaf' } } ],
					species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
				}) });
			}

			if (s.includes('/pokemon-species/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ flavor_text_entries: [ { language: { name: 'es' }, flavor_text: 'Texto en español' } ] }) });
			}

			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(PokemonDetail);
		await flushPromises();
		await wrapper.vm.$nextTick();

		expect(global.fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/1');
	});

	it('displays pokemon sprites', async () => {
		// Verifica que se muestran los sprites del pokemon (frontal, trasero, arte oficial)
		global.fetch.mockImplementation((url) => {
			const s = String(url);
			if (s.endsWith('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({
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
					moves: [ { move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }, { move: { name: 'razor-leaf' } } ],
					species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
				}) });
			}

			if (s.includes('/pokemon-species/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ flavor_text_entries: [ { language: { name: 'es' }, flavor_text: 'Texto en español' } ] }) });
			}

			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(PokemonDetail);
		await flushPromises();
		await wrapper.vm.$nextTick();

		const imgs = wrapper.findAll('img');
		const srcs = imgs.map((i) => i.attributes('src'));
		expect(srcs).toEqual(expect.arrayContaining(['http://img.local/front.png', 'http://img.local/back.png', 'http://img.local/art.png']));
	});

	it('displays pokemon description', async () => {
		// Verifica que se muestra la descripción del pokemon obtenida de la especie
		global.fetch.mockImplementation((url) => {
			const s = String(url);
			if (s.endsWith('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({
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
					moves: [ { move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }, { move: { name: 'razor-leaf' } } ],
					species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
				}) });
			}

			if (s.includes('/pokemon-species/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ flavor_text_entries: [ { language: { name: 'es' }, flavor_text: 'Texto en español' } ] }) });
			}

			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(PokemonDetail);
		await flushPromises();
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain('Texto en español');
	});

	it('displays pokemon moves', async () => {
		// Verifica que se muestran los movimientos del pokemon
		global.fetch.mockImplementation((url) => {
			const s = String(url);
			if (s.endsWith('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({
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
					moves: [ { move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }, { move: { name: 'razor-leaf' } } ],
					species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
				}) });
			}

			if (s.includes('/pokemon-species/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ flavor_text_entries: [ { language: { name: 'es' }, flavor_text: 'Texto en español' } ] }) });
			}

			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(PokemonDetail);
		await flushPromises();
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain('tackle');
	});

	it('displays pokemon key texts (name, types, abilities, stats)', async () => {
		// Verifica que se muestran los textos clave del pokemon: nombre capitalizado, tipos, habilidades, estadísticas, identificador
		global.fetch.mockImplementation((url) => {
			const s = String(url);
			if (s.endsWith('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({
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
					moves: [ { move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }, { move: { name: 'razor-leaf' } } ],
					species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
				}) });
			}

			if (s.includes('/pokemon-species/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ flavor_text_entries: [ { language: { name: 'es' }, flavor_text: 'Texto en español' } ] }) });
			}

			return Promise.reject(new Error('unexpected fetch ' + url));
		});

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
		// Verifica que el botón "Volver" llama a router.push('/') para navegar a la página principal
		global.fetch.mockImplementation((url) => {
			const s = String(url);
			if (s.endsWith('/pokemon/1')) {
				return Promise.resolve({ json: () => Promise.resolve({
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
					moves: [ { move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }, { move: { name: 'razor-leaf' } } ],
					species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }
				}) });
			}

			if (s.includes('/pokemon-species/1')) {
				return Promise.resolve({ json: () => Promise.resolve({ flavor_text_entries: [ { language: { name: 'es' }, flavor_text: 'Texto en español' } ] }) });
			}

			return Promise.reject(new Error('unexpected fetch ' + url));
		});

		const wrapper = mount(PokemonDetail);
		await flushPromises();
		await wrapper.vm.$nextTick();

		const back = wrapper.find('button.back-button');
		await back.trigger('click');
		expect(pushMock).toHaveBeenCalledWith('/');
	});
});
