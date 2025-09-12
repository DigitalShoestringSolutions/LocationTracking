

import { Card, Container, Spinner } from "react-bootstrap";

export function LoadingIndicator() {
    return <Container fluid="md">
        <Card className='mt-2 text-center'>
            <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>
        </Card>
    </Container>
}