# Sketch Page Exporter

[中文](#中文) | [English](#english)

<a id="中文"></a>
## 中文

一个适用于 Sketch 的页面导出插件。选择需要的格式后，插件会将当前页面或画板导出到指定目录。

### 功能

- **HTML（含 CSS）**：使用 Sketch 原生渲染整页预览，保留字体、图层效果和原始布局。HTML 通过图片展示页面，因此视觉效果稳定，但页面不是可编辑的 HTML 图层。
- **JSON**：调用 Sketch 原生 JSON 导出，保留 Sketch 页面与图层对象、ID、文字属性和样式等数据。
- **CSS**：生成基础样式文件。
- **PNG、SVG、PDF、JPG、WebP**：导出当前页面的顶层画板。
- 每次只导出所选格式。HTML 会附带其依赖的 CSS 和页面预览图。

### 安装

1. 下载仓库中的 `SketchPageExporter.sketchplugin` 文件夹，或下载并解压 [`SketchPageExporter-1.5.0.zip`](SketchPageExporter-1.5.0.zip)。
2. 双击 `SketchPageExporter.sketchplugin` 安装；也可以将整个插件包复制到：
   `~/Library/Application Support/com.bohemiancoding.sketch3/Plugins/`
3. 重启 Sketch。

### 使用

在 Sketch 中选择 **插件 → Export Page…**，选择一种导出格式，再选择目标目录。导出文件会放入目标目录下以当前页面名称命名的子文件夹。

### 兼容性

本插件以 Sketch 94 为目标版本，清单声明兼容版本为 59.1。不同版本对 Sketch 原生 JSON 的结构可能有差异。

### 开发

- 插件清单：`SketchPageExporter.sketchplugin/Contents/Sketch/manifest.json`
- 插件脚本：`SketchPageExporter.sketchplugin/Contents/Sketch/plugin.js`

<a id="english"></a>
## English

A Sketch plugin for exporting the selected page or its artboards. Choose an output format before exporting.

### Features

- **HTML (with CSS):** Uses Sketch's native renderer for a full-page preview, preserving typography, layer effects, and layout. The page is displayed as an image in HTML, so the visual result is stable but the design is not represented as editable HTML layers.
- **JSON:** Uses Sketch's native JSON export and preserves Sketch page and layer objects, IDs, text attributes, styles, and other available data.
- **CSS:** Writes a base stylesheet.
- **PNG, SVG, PDF, JPG, WebP:** Exports the selected page's top-level artboards.
- Exports only the selected format. HTML also includes its required stylesheet and page preview image.

### Installation

1. Download the `SketchPageExporter.sketchplugin` bundle from this repository, or download and extract [`SketchPageExporter-1.5.0.zip`](SketchPageExporter-1.5.0.zip).
2. Double-click `SketchPageExporter.sketchplugin` to install, or copy the whole bundle to:
   `~/Library/Application Support/com.bohemiancoding.sketch3/Plugins/`
3. Restart Sketch.

### Usage

In Sketch, choose **Plugins → Export Page…**, select one format, and choose an output directory. Files are placed in a subfolder named after the selected page.

### Compatibility

The plugin targets Sketch 94 and declares a minimum compatible version of 59.1. The structure of Sketch's native JSON may vary between Sketch versions.

### Development

- Manifest: `SketchPageExporter.sketchplugin/Contents/Sketch/manifest.json`
- Plugin script: `SketchPageExporter.sketchplugin/Contents/Sketch/plugin.js`
