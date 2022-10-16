// Create DEAD LETTER QUEUE exchange
// Create QUEUE to store message coming DLQ exchange
// Bind queue to exchange

// Create exchange 
// Create queue
// Bind queue to exchange

const amqplib = require('amqplib');
const queue = 'tasks';


const publish = async () => {
    const conn = await amqplib.connect('amqp://localhost')
    const channel = await conn.createChannel()

    await channel.assertExchange("email_dead_letter_exchange", "direct", {
        durable: true
    })
    await channel.assertQueue("email_dlq_queue", { durable: true });
    await channel.bindQueue("email_dlq_queue", "email_dead_letter_exchange", "email_dlq")

    await channel.assertExchange("email_exchange", "direct", {
        durable: true
    })
    await channel.assertQueue("email_queue", {
        arguments: {
            'x-dead-letter-exchange': 'email_dead_letter_exchange',
            'x-dead-letter-routing-key': 'email_dlq',
            'x-queue-type': 'classic',
        },
        durable: true
    });
    await channel.bindQueue("email_queue", "email_exchange", "email")
    setInterval(async () => {
        console.log("Publishing...")
        await channel.publish(
            'email_exchange', 'email', 
            Buffer.from(
                JSON.stringify({
                    message: "Hello",
                    maxRetries: 3,
                    retries: 0
                })
            )
        );
    }, 1000)
    
}

publish();