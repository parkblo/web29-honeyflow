import { defaultKeymap } from "@codemirror/commands";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { html } from "@milkdown/kit/component";
import {
  codeBlockComponent,
  codeBlockConfig,
} from "@milkdown/kit/component/code-block";
import { Editor, rootCtx } from "@milkdown/kit/core";
import { Ctx } from "@milkdown/kit/ctx";
import { block } from "@milkdown/kit/plugin/block";
import { cursor } from "@milkdown/kit/plugin/cursor";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import { collab } from "@milkdown/plugin-collab";
import { useEditor } from "@milkdown/react";
import { nord } from "@milkdown/theme-nord";
import {
  ReactPluginViewComponent,
  usePluginViewFactory,
} from "@prosemirror-adapter/react";
import { basicSetup } from "codemirror";

import { placeholder, placeholderCtx } from "@/lib/milkdown-plugin-placeholder";

const check = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="h-6 w-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
`;

type useMilkdownEditorProps = {
  placeholderValue?: string;
  BlockView: ReactPluginViewComponent;
};

export default function useMilkdownEditor({
  placeholderValue = "제목을 입력하세요",
  BlockView,
}: useMilkdownEditorProps) {
  const pluginViewFactory = usePluginViewFactory();

  return useEditor((root) => {
    return Editor.make()
      .config((ctx: Ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(placeholderCtx, placeholderValue);
        ctx.set(block.key, {
          view: pluginViewFactory({
            component: BlockView,
          }),
        });
        ctx.update(codeBlockConfig.key, (defaultConfig) => ({
          ...defaultConfig,
          languages,
          extensions: [basicSetup, oneDark, keymap.of(defaultKeymap)],
          renderLanguage: (language, selected) => {
            return html`<span class="leading">${selected ? check : null}</span
              >${language}`;
          },
        }));
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(placeholder)
      .use(codeBlockComponent)
      .use(block)
      .use(cursor)
      .use(collab);
  }, []);
}
