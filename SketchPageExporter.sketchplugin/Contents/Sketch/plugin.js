var sketch = require('sketch/dom');
var UI = require('sketch/ui');

function onExportPage(context) {
  var document = sketch.getSelectedDocument();
  if (!document) { UI.message('请先打开一个 Sketch 文档。'); return; }
  var page = document.selectedPage;
  if (!page) { UI.message('当前文档没有选中的页面。'); return; }

  var formats = ['HTML（含 CSS）', 'JSON', 'CSS', 'PNG', 'SVG', 'PDF', 'JPG', 'WebP'];
  UI.getInputFromUser('选择本次要导出的格式', {
    type: UI.INPUT_TYPE.selection,
    possibleValues: formats,
    initialValue: formats[0],
    description: '每次只导出一种格式；HTML 会同时生成必需的 styles.css。'
  }, function (error, choice) {
    if (error || !choice) return;
    var format = choice === 'HTML（含 CSS）' ? 'html' : String(choice).toLowerCase();
    if (format === 'webp') format = 'webp';
    chooseOutputAndExport(page, format);
  });
}

function chooseOutputAndExport(page, format) {
  try {
    var panel = NSOpenPanel.openPanel();
    panel.setCanChooseFiles(false);
    panel.setCanChooseDirectories(true);
    panel.setCanCreateDirectories(true);
    panel.setPrompt('选择');
    panel.setMessage('选择导出目录');
    if (panel.runModal() !== NSModalResponseOK) return;

    var root = String(panel.URL().path());
    var output = root + '/' + safeName(page.name || 'Sketch Page');
    var fileManager = NSFileManager.defaultManager();
    var createError = MOPointer.alloc().init();
    fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(output, true, nil, createError);

    var boards = [];
    (page.layers || []).forEach(function (layer) {
      if (layer.type === sketch.Types.Artboard) boards.push(layer);
    });
    var data = { page: { name: page.name } };

    var failures = [];
    if (format === 'json') {
      var nativePageJSON = sketch.export(page, { formats: ['json'], output: false });
      if (nativePageJSON === undefined || nativePageJSON === null) {
        throw new Error('Sketch 没有返回页面 JSON 数据。');
      }
      if (typeof nativePageJSON === 'string') nativePageJSON = JSON.parse(nativePageJSON);
      writeText(output + '/page.json', JSON.stringify(nativePageJSON, null, 2));
    }
    else if (format === 'css') writeText(output + '/styles.css', renderCSS());
    else if (format === 'html') {
      if (!boards.length) throw new Error('当前页面没有可导出的顶层画板。');
      var assetsPath = output + '/html-assets';
      var assetsError = MOPointer.alloc().init();
      fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(assetsPath, true, nil, assetsError);
      sketch.export(page, {
        formats: ['png'],
        scales: ['1'],
        output: assetsPath,
        overwriting: true
      });
      var exportedFiles = fileManager.contentsOfDirectoryAtPath_error(assetsPath, MOPointer.alloc().init());
      var previews = [];
      for (var fileIndex = 0; fileIndex < exportedFiles.count(); fileIndex++) {
        var fileName = String(exportedFiles.objectAtIndex(fileIndex));
        if (fileName.toLowerCase().slice(-4) === '.png') previews.push(fileName);
      }
      if (!previews.length) throw new Error('Sketch 未生成页面预览 PNG。');
      var previewName = 'html-assets/' + previews[0];
      writeText(output + '/index.html', renderHTML(data, previewName));
      writeText(output + '/styles.css', renderCSS());
    } else {
      if (!boards.length) throw new Error('当前页面没有可导出的顶层画板。');
      boards.forEach(function (board) {
        try {
          sketch.export(board, { formats: [format], scales: ['1'], output: output, overwriting: true });
        } catch (error) {
          failures.push(String(board.name) + '：' + String(error));
        }
      });
    }

    if (failures.length) UI.alert('部分导出失败', failures.join('\n'));
    else UI.message('已导出 ' + String(choiceLabel(format)) + '：' + output);
  } catch (error) {
    UI.alert('导出失败', String(error));
    console.log(error && error.stack ? error.stack : String(error));
  }
}

function choiceLabel(format) {
  return format === 'html' ? 'HTML（含 CSS）' : format.toUpperCase();
}

function writeText(path, contents) {
  var error = MOPointer.alloc().init();
  var success = NSString.stringWithString(String(contents)).writeToFile_atomically_encoding_error(
    path,
    true,
    NSUTF8StringEncoding,
    error
  );
  if (!success) throw new Error('无法写入文件：' + path + (error.value() ? '；' + error.value().localizedDescription() : ''));
}

function serializeLayer(layer) {
  var frame = layer.frame || { x: 0, y: 0, width: 0, height: 0 };
  var style = layer.style || {};
  var fills = [];
  var borders = [];
  (style.fills || []).forEach(function (fill) {
    if (fill.enabled !== false) fills.push({ type: fill.fillType || 'Color', color: fill.color || null });
  });
  (style.borders || []).forEach(function (border) {
    if (border.enabled !== false) borders.push({ color: border.color || null, thickness: number(border.thickness) });
  });
  var text = null;
  if (layer.type === sketch.Types.Text) text = String(layer.text || '');
  var children = [];
  (layer.layers || []).forEach(function (child) { children.push(serializeLayer(child)); });
  return {
    id: layer.id,
    name: layer.name || '',
    type: layer.type || 'Layer',
    visible: !layer.hidden,
    frame: { x: number(frame.x), y: number(frame.y), width: number(frame.width), height: number(frame.height) },
    rotation: number(layer.transform && layer.transform.rotation),
    opacity: style.opacity === undefined ? 1 : number(style.opacity),
    fills: fills,
    borders: borders,
    text: text,
    children: children
  };
}

function renderHTML(data, previewName) {
  return '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHTML(data.page.name) + '</title><link rel="stylesheet" href="styles.css"></head><body><main class="page"><img class="page-preview" src="' + escapeHTML(encodePath(previewName)) + '" alt="' + escapeHTML(data.page.name) + '"></main></body></html>\n';
}

function encodePath(path) {
  return String(path).split('/').map(function (part) { return encodeURIComponent(part); }).join('/');
}

function renderLayers(layers, originX, originY) {
  var html = [];
  (layers || []).forEach(function (layer) {
    if (!layer.visible) return;
    var style = 'left:' + (layer.frame.x - originX) + 'px;top:' + (layer.frame.y - originY) + 'px;width:' + layer.frame.width + 'px;height:' + layer.frame.height + 'px;opacity:' + layer.opacity + ';';
    if (layer.text !== null) style += 'white-space:pre-wrap;';
    else if (layer.fills.length && layer.fills[0].color) style += 'background-color:' + cssColor(layer.fills[0].color) + ';';
    if (layer.borders.length && layer.borders[0].color) style += 'border:' + layer.borders[0].thickness + 'px solid ' + cssColor(layer.borders[0].color) + ';';
    var content = layer.text !== null ? escapeHTML(layer.text) : renderLayers(layer.children, layer.frame.x, layer.frame.y);
    html.push('<div class="layer" data-type="' + escapeHTML(layer.type) + '" data-name="' + escapeHTML(layer.name) + '" style="' + style + '">' + content + '</div>');
  });
  return html.join('\n');
}

function renderCSS() {
  return '*{box-sizing:border-box}\nhtml,body{margin:0;min-height:100%;padding:0}\nbody{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f2f3f5}\n.page{display:flex;justify-content:center;align-items:flex-start;padding:24px}\n.page-preview{display:block;width:auto;height:auto;max-width:100%;object-fit:contain;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12)}\n';
}

function safeName(value) {
  var name = String(value || 'untitled');
  var invalid = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
  invalid.forEach(function (character) { name = name.split(character).join('-'); });
  return name || 'untitled';
}
function escapeHTML(value) {
  var text = String(value || '');
  text = text.split('&').join('&amp;');
  text = text.split('<').join('&lt;');
  text = text.split('>').join('&gt;');
  text = text.split('"').join('&quot;');
  text = text.split("'").join('&#39;');
  return text;
}
function cssColor(value) { return String(value).substring(0, 7); }
function number(value) {
  var parsed = Number(value);
  return isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}
