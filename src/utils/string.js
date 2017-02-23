exports.sanitize = (value, type = 'number') => {
  switch (type) {
    case 'number':
      return value.toString().replace(/[^0-9]/, '') * 1;
    case 'alphanumeric':
      return value.replace(/[^a-z0-9]/i, '');
    case 'alpha':
      return value.replace(/[^a-z]/i, '');
    case 'hex':
      return value.toLowerCase().replace(/[^0-9a-f]/, '');
    default:
      return value.replace(/[^0-9]/, '');
  }
};

exports.camelCase = input => (
  input.toLowerCase().replace(/_(.)/g, (match, letter) => letter.toUpperCase())
);
