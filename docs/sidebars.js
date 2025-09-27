/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'intro',
        'installation',
        'configuration',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference',
        'ethereum-endpoints',
        'image-storage-endpoints',
        'face-recognition-endpoints',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'usage-examples',
        'curl-examples',
      ],
    },
  ],
};

export default sidebars;
