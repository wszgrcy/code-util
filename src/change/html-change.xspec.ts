import { createCssSelectorForHtml } from '../selector';
import { UpdaterPlain } from '../updater/updater-plain';
import { HtmlChange } from './html-change';

// describe('html-change', () => {
//     let content = `<div id="abc"></div>`;
//     it('替换标签名', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let result = change.replaceTagName(element, 'span');
//         let newResult = UpdaterPlain.update(content, result);

//         expect(newResult).to.eq(`<span id="abc"></span>`);
//     });
//     it('替换标签', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();

//         let result = change.replaceTag(element, '<span></span>');
//         let newResult = UpdaterPlain.update(content, [result]);
//         expect(newResult).to.eq(`<span></span>`);
//     });
//     it('删除标签', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let result = change.deleteTag(element);
//         let newResult = UpdaterPlain.update(content, [result]);
//         expect(newResult).to.eq('');
//     });
//     it('插入标签(beforebegin)', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.insertTag(element, 'insertContent');
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq('insertContent' + content);
//     });
//     it('插入标签(afterbegin)', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.insertTag(element, 'insertContent', 'afterbegin');
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(`<div id="abc">insertContent</div>`);
//     });
//     it('插入标签(beforeend)', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.insertTag(element, 'insertContent', 'beforeend');
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(`<div id="abc">insertContent</div>`);
//     });
//     it('插入标签(afterend)', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.insertTag(element, 'insertContent', 'afterend');
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(content + 'insertContent');
//     });
//     it('插入标签属性', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.insertTagAttribute(element, `name="test"`);
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(`<div id="abc" name="test"></div>`);
//     });
//     it('删除标签属性', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.deleteTagAttribute(element, `id`);
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(`<div ></div>`);
//     });
//     it('设置标签属性', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.setTagAttribute(element, `name="test" value="test"`);
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(`<div name="test" value="test"></div>`);
//     });
//     it('替换属性标签', async () => {
//         let selector = await createCssSelectorForHtml(content);
//         let element = selector.queryOne('div');
//         let change = new HtmlChange();
//         let insertChange = change.replaceTagAttribute(element.attrs[0], `id="mytest"`);
//         let result = UpdaterPlain.update(content, [insertChange]);
//         expect(result).to.eq(`<div id="mytest"></div>`);
//     });
// });
