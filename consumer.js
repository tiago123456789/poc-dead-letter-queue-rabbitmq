const amqplib = require('amqplib');

const consumer = async () => {
    const conn = await amqplib.connect('amqp://localhost')
    const channel = await conn.createChannel()
    await channel.assertQueue("email_queue", {
        arguments: {
            'x-dead-letter-exchange': 'email_dead_letter_exchange',
            'x-dead-letter-routing-key': 'email_dlq',
            'x-queue-type': 'classic',
        },
        durable: true
    });
    await channel.consume('email_queue', async (message) => {
        try {
            if (!message) {
                throw new Error("Don't have message")
            }
            throw new Error("Error teste")
            channel.ack(message, false, false)
        } catch(error) {
            // Case no necessary retry use channel.reject(message, false)
            console.log("Error:", error.message);
            const body = JSON.parse(message.content.toString());
            if (body.retries >= body.maxRetries) {
                await channel.reject(message, false)
                return;
            }
            body.retries += 1
            channel.ack(message, false, false)
            channel.publish(
                message.fields.exchange, message.fields.routingKey, 
                Buffer.from(JSON.stringify(body))
            )
        }
        
    });
}

consumer();