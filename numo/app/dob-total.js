const dobTotal = ( input ) => {
    const pattern = new RegExp( /^[a-z0-9]+$/i );
    if ( typeof input !== 'string' && pattern.test( input ) ) {
        throw new Error('Accepts only string input');
    }
    const characters = input.toLowerCase().replace( /\s/g, '' ).split ( '-' );
    const reducer = ( accumulator, currentValue ) => (accumulator + currentValue) % 9 || 9;
    return {
        vital: characters.reduce( reducer, 0 ),
        corpal: characters[characters.length - 1] % 9 || 9
    }
};

export default dobTotal;