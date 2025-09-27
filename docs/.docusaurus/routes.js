import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'ffb'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '5a2'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '6aa'),
            routes: [
              {
                path: '/docs/api-reference',
                component: ComponentCreator('/docs/api-reference', '756'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/configuration',
                component: ComponentCreator('/docs/configuration', 'e8e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/curl-examples',
                component: ComponentCreator('/docs/curl-examples', 'bf6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/ethereum-endpoints',
                component: ComponentCreator('/docs/ethereum-endpoints', '714'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/face-recognition-endpoints',
                component: ComponentCreator('/docs/face-recognition-endpoints', '511'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/image-storage-endpoints',
                component: ComponentCreator('/docs/image-storage-endpoints', '977'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/installation',
                component: ComponentCreator('/docs/installation', 'b74'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/usage-examples',
                component: ComponentCreator('/docs/usage-examples', '0e7'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
