const API_BRASIL_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2dhdGV3YXkuYXBpYnJhc2lsLmlvL2FwaS92Mi9hdXRoL2tleWNsb2FrL2V4Y2hhbmdlIiwiaWF0IjoxNzc2MzEzNTk5LCJleHAiOjE4MDc4NDk1OTksIm5iZiI6MTc3NjMxMzU5OSwianRpIjoiUXo2bHlGaFJJeHYzWFAxNyIsInN1YiI6IjIxODA3In0.L2ZlLKXoZAYbu-0kjlqW32FxySDP-rtRv6TfncDRM8Q";
const placa = "SYA7J13";

async function testApiBrasil() {
    console.log(`Testando placa: ${placa}`);
    try {
        const response = await fetch('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_BRASIL_TOKEN}`
            },
            body: JSON.stringify({
                tipo: 'fipe-chassi',
                placa: placa,
                homolog: false
            })
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Dados:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro:', error);
    }
}

testApiBrasil();
