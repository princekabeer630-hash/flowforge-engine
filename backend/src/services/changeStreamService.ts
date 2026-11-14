import { WorkflowModel } from '../models/Workflow';

export function initWorkflowChangeStream(io: any) {
  try {
    // Open a MongoDB Change Stream on the workflows collection
    const changeStream = WorkflowModel.watch();

    changeStream.on('change', (change: any) => {
      console.log('🔄 MongoDB Change Stream event detected! Type:', change.operationType);
      console.log('Full change object:', JSON.stringify(change, null, 2));

      if (change.operationType === 'insert') {
        const newWorkflow = change.fullDocument;
        io.emit('workflow_db_insert', {
          message: 'A new workflow was inserted into MongoDB!',
          workflow: newWorkflow
        });
      } else if (change.operationType === 'update' || change.operationType === 'replace') {
        io.emit('workflow_db_update', {
          message: 'A workflow was updated in MongoDB!',
          documentKey: change.documentKey,
          updatedFields: (change as any).updateDescription?.updatedFields
        });
      }
    });

    changeStream.on('error', (error: any) => {
      console.error('MongoDB Change Stream error:', error);
    });

    console.log('✅ MongoDB Change Stream listener initialized successfully on Atlas Cluster.');
  } catch (err) {
    console.warn('⚠️ Error initializing change stream:', err);
  }
}