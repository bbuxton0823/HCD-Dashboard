import Head from 'next/head';
import { useRouter } from 'next/router';
import styled from 'styled-components';

const UnauthorizedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--background-color);
  text-align: center;
`;

const UnauthorizedCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 600px;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #d9534f;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: var(--text-color);
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #004a7c;
  }
`;

const UnauthorizedPage = () => {
  const router = useRouter();
  
  return (
    <>
      <Head>
        <title>Unauthorized Access - San Mateo County Housing Dashboard</title>
      </Head>
      
      <UnauthorizedContainer>
        <UnauthorizedCard>
          <Title>Unauthorized Access</Title>
          <Message>
            You do not have permission to access this resource. 
            This may be because you need different privileges or you need to log in again.
          </Message>
          <Button onClick={() => router.push('/')}>
            Return to Dashboard
          </Button>
        </UnauthorizedCard>
      </UnauthorizedContainer>
    </>
  );
};

export default UnauthorizedPage; 