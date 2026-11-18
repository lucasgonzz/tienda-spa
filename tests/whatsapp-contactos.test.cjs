const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const compiler = require('vue-template-compiler')
const root = path.resolve(__dirname, '..')
function load(file) {
 const source = fs.readFileSync(path.join(root, file), 'utf8')
 const js = file.endsWith('.vue') ? compiler.parseComponent(source).script.content : source
 const code = babel.transformSync(js, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
 const module = { exports: {} }
 new Function('require', 'module', 'exports', code)(name => name === '@/mixins/_categories' ? { default: {} } : name.startsWith('@/') ? load('src/' + name.slice(2) + '.js') : require(name), module, module.exports)
 return module.exports
}
const helpers = load('src/helpers/whatsapp_contacts.js')
const whatsapp = load('src/mixins/whatsapp.js').default
function vm(configuration, phone = '+54 9 11 4123-4567') {
 return new Vue({ mixins: [whatsapp], data() { return { commerce: { phone, online_configuration: configuration } } } })
}
test('normaliza internacionales explícitos sin inferir país', () => {
 for (const [input, expected] of [['+54 9 (11) 4123-4567', '5491141234567'], ['00 34 612 345 678', '34612345678'], ['12025550123', '12025550123'], ['+1.202.555.0123', '12025550123'], ['12345678', '12345678'], ['123456789012345', '123456789012345']]) assert.equal(helpers.normalizeInternationalWhatsappPhone(input), expected)
})
test('inválidos nunca producen enlace', () => {
 for (const input of ['', ' ', null, undefined, [], {}, 5491141234567, '1234567', '1234567890123456', '0123456789', 'https://wa.me/5491141234567', 'abc5491141234567', '+54 91141234567 ext 2', '+54+91141234567', '+005491141234567']) assert.equal(helpers.normalizeInternationalWhatsappPhone(input), '', String(input))
})
test('destinos propios con nombres y enlaces claros, sin alterar teléfono general', () => {
 const view = vm({ whatsapp_consultations_phone: '+5491141234567', whatsapp_seller_phone: '0034612345678' })
 assert.deepEqual(JSON.parse(JSON.stringify(view.storefront_whatsapp_contacts)), [
  { key: 'consultations', name: 'Consultas', phone: '5491141234567', link: 'https://wa.me/5491141234567' },
  { key: 'seller', name: 'Hablar con un vendedor', phone: '34612345678', link: 'https://wa.me/34612345678' },
 ])
 assert.equal(view.commerce_whatsapp_phone, '5491141234567')
 assert.equal(view.commerce.phone, '+54 9 11 4123-4567')
})
test('contrato anterior, vacíos e inválidos conservan un contacto general', () => {
 for (const config of [null, undefined, {}, { whatsapp_consultations_phone: null, whatsapp_seller_phone: '' }, { whatsapp_consultations_phone: 'inválido', whatsapp_seller_phone: '0' }]) {
  assert.equal(vm(config).storefront_whatsapp_contacts.length, 1)
  assert.equal(vm(config).storefront_whatsapp_contacts[0].key, 'general')
 }
 assert.deepEqual(Array.from(vm({}, null).storefront_whatsapp_contacts), [])
})
test('sólo un destino válido no inventa un segundo contacto', () => {
 assert.deepEqual(helpers.whatsappContacts({ whatsapp_consultations_phone: 'inválido', whatsapp_seller_phone: '+34612345678' }).map(c => c.key), ['seller'])
 assert.deepEqual(helpers.whatsappContacts({ whatsapp_consultations_phone: '+34612345678' }).map(c => c.key), ['consultations'])
})
test('pedidos conservan el contacto general aunque haya destinos nuevos', () => {
 for (const phone of ['+54 9 11 4123-4567', '1141234567']) {
  assert.equal(vm({ whatsapp_seller_phone: '+34612345678' }, phone).commerce_whatsapp_phone, '5491141234567')
 }
})
test('componente real renderiza enlaces seguros y ambos rótulos', () => {
 const file = 'src/components/common/BtnWhatsApp.vue'
 const component = load(file).default
 const template = compiler.parseComponent(fs.readFileSync(path.join(root, file), 'utf8')).template.content
 const compiled = compiler.compileToFunctions(template)
 const view = new Vue({ ...component, mixins: [whatsapp], render: compiled.render, staticRenderFns: compiled.staticRenderFns, data() { return { ...component.data(), route_name: 'Home', commerce: { phone: '+5491141234567', online_configuration: { whatsapp_consultations_phone: '+5491141234567', whatsapp_seller_phone: '+34612345678' } } } } })
 view.scroll_bottom = true
 const links = view._render().children.filter(node => node.tag === 'a')
 assert.equal(links.length, 2)
 assert.deepEqual(links.map(link => link.data.attrs.href), ['https://wa.me/5491141234567', 'https://wa.me/34612345678'])
 for (const link of links) {
  assert.equal(link.data.attrs.target, '_blank')
  assert.equal(link.data.attrs.rel, 'noopener noreferrer')
  assert.match(link.data.attrs['aria-label'], /abre en una pestaña nueva/)
 }
 assert.equal(links[1].children.find(node => node.tag === 'span').children[0].text, 'Hablar con un vendedor')
})

test('Contacto conserva su URL legada y usa ambos destinos sólo al configurarlos', () => {
 const component = load('src/components/common/ContactInfo.vue').default
 const view = vm({}, '03444 15 622139')
 const legacy = component.computed.items.call(view)
 assert.equal(legacy[0].link, 'https://api.whatsapp.com/send?phone=03444 15 622139')
 view.commerce.online_configuration = { whatsapp_consultations_phone: '+5491141234567', whatsapp_seller_phone: '+34612345678' }
 const contacts = component.computed.items.call(view)
 assert.deepEqual(contacts.map(c => c.name), ['Consultas', 'Hablar con un vendedor'])
 assert.deepEqual(contacts.map(c => c.link), ['https://wa.me/5491141234567', 'https://wa.me/34612345678'])
})


test('el pie conserva su URL legada y comparte los dos destinos configurados', () => {
 const component = load('src/components/common/footer/Index.vue').default
 const view = vm({}, '03444 15 622139')
 assert.equal(component.computed.footer_whatsapp_contacts.call(view)[0].link, 'https://api.whatsapp.com/send?phone=03444 15 622139')
 view.commerce.online_configuration = { whatsapp_consultations_phone: '+5491141234567', whatsapp_seller_phone: '+34612345678' }
 assert.deepEqual(component.computed.footer_whatsapp_contacts.call(view).map(c => c.name), ['Consultas', 'Hablar con un vendedor'])
})

test('los flotantes nuevos se ocultan al entrar Contacto o pie y reaparecen al salir', t => {
 const component = load('src/components/common/BtnWhatsApp.vue').default
 const previousDocument = global.document
 const previousWindow = global.window
 t.after(() => { global.document = previousDocument; global.window = previousWindow })
 global.window = { innerHeight: 900, scrollY: 200 }
 let boxes = [{ top: 950, bottom: 1200 }, { top: 1300, bottom: 1500 }]
 global.document = { querySelectorAll(selector) { assert.equal(selector, '.contact-info, .site-footer'); return boxes.map(box => ({ getBoundingClientRect: () => box })) } }
 const view = { custom_contacts: true, contact_section_visible: false, scroll: 0, scroll_bottom: false }
 view.updateContactVisibility = component.methods.updateContactVisibility.bind(view)
 component.methods.trackScroll.call(view)
 assert.equal(view.scroll_bottom, true)
 assert.equal(view.contact_section_visible, false)
 boxes = [{ top: 899, bottom: 1200 }]
 view.updateContactVisibility()
 assert.equal(view.contact_section_visible, true)
 boxes = [{ top: -100, bottom: 0 }, { top: 900, bottom: 1200 }]
 view.updateContactVisibility()
 assert.equal(view.contact_section_visible, false)
 boxes = []
 view.updateContactVisibility()
 assert.equal(view.contact_section_visible, false)
 boxes = [{ top: -200, bottom: 0 }, { top: 800, bottom: 1100 }]
 view.updateContactVisibility()
 assert.equal(view.contact_section_visible, true)
 boxes = [{ top: -100, bottom: 100 }]
 view.updateContactVisibility()
 assert.equal(view.contact_section_visible, true)
 view.custom_contacts = false
 view.updateContactVisibility()
 assert.equal(view.contact_section_visible, false)
})
