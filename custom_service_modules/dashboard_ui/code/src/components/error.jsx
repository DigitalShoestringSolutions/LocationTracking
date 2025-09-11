
import { Card, Container } from "react-bootstrap";

export function ErrorIndicator({ error }) {
    return <Container fluid="md">
        <Card className='mt-2 text-center'>
            <h1>{error}</h1>
        </Card>
    </Container>
}