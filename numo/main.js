import * as dictionary from './numo.json';
const nameTotal = ( input ) => {
    const pattern = new RegExp( /^[a-z0-9]+$/i );
    if ( typeof input !== 'string' && pattern.test( input ) ) {
        throw new Error('Accepts only string input');
    }
    const characters = input.toLowerCase().replace( /\s/g, '' ).split ( '' );

    const reducer = ( accumulator, currentValue ) => accumulator + dictionary[ currentValue ];
    return characters.reduce( reducer, 0 );
};

export default nameTotal;