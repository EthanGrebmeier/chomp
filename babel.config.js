const lucideIconAliases = {
  'alert-circle': 'circle-alert',
  'alert-triangle': 'triangle-alert',
  'check-circle': 'circle-check',
  'more-horizontal': 'ellipsis',
  trash2: 'trash-2',
  undo2: 'undo-2',
};

const getLucideIconImportPath = transformedName => {
  const iconName = transformedName.replace(/-icon$/, '');

  if (iconName === 'icon') {
    return 'lucide-react-native/dist/esm/Icon';
  }

  const moduleName = lucideIconAliases[iconName] ?? iconName;
  return `lucide-react-native/dist/esm/icons/${moduleName}`;
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      ['inline-import', { extensions: ['.sql'] }],
      [
        'import',
        {
          libraryName: 'lucide-react-native',
          customName: getLucideIconImportPath,
        },
        'lucide-react-native',
      ],
    ],
  };
};
