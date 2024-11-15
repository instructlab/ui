// src/app/playground/chat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Breadcrumb, BreadcrumbItem, PageBreadcrumb, PageSection, TextContent, TextInput, Title } from '@patternfly/react-core/';
import { Select } from '@patternfly/react-core/dist/dynamic/components/Select';
import { SelectOption, SelectList } from '@patternfly/react-core/dist/dynamic/components/Select';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import styles from './ragpipeline.module.css';
import { Endpoint, Message, Model } from '@/types';
import CopyToClipboardButton from '@/components/CopyToClipboardButton';
import ReactFlow, { addEdge, MiniMap, Controls, Background, Node, Edge, Connection, 
  applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, ReactFlowInstance, 
  Handle, Position, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

const ChatPage: React.FC = () => {

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];


  const predefinedNodeTypes = {
    vectorDB: {
      label: 'Vector DB',
      color: '#FFD700',
      shape: 'rectangle',
      parameters: [
        { name: 'Type', type: 'enum', options: ['Elasticsearch', 'Milvus', 'Faiss'], defaultValue: 'Elasticsearch' },
        { name: 'URL', type: 'string', defaultValue: 'localhost:9200' },
        { name: 'Use Dense Embedding', type: 'boolean', defaultValue: true },
      ],
    },
    llm: {
      label: 'LLM',
      color: '#40E0D0',
      shape: 'rectangle',
      parameters: [
        { name: 'Platform', type: 'enum', options: ['InstructLab', 'OpenAI', 'Claude', 'Local'], defaultValue: 'InstructLab' },
        { name: 'URL', type: 'string', defaultValue: 'localhost:8080' },
        { name: 'Model Name', type: 'string', defaultValue: 'Merlinite-7b' },
      ],
    },
    query: {
      label: 'User Query',
      color: '#FF6347',
      shape: 'ellipse',
      parameters: [
        { name: 'Enable Automatic Prompt Rewriting', type: 'boolean', defaultValue: false },
        { name: 'Enable Automatic RAG Source Estimation', type: 'boolean', defaultValue: false },
      ],
    },
    postRetrieval: {
      label: 'Post-Retrieval',
      color: '#27AE60',
      shape: 'ellipse',
      parameters: [
        { name: 'Type', type: 'enum', options: ['Document Filtering', 'Document Ranking', 'Summarization'], defaultValue: 'Document Filtering' },
      ],
    },
    evaluation: {
      label: 'Pipeline Evaluation',
      color: '#D35400',
      shape: 'ellipse',
      parameters: [
      ],
    },
  };

  // Type representing all the possible node types
  type NodeType = keyof typeof predefinedNodeTypes;

  // Custom Node Component with Left and Right Handles
  const CustomNode = ({ data, id, onNodeDoubleClick }: any) => (
    <div
    onDoubleClick={() => onNodeDoubleClick(id)}
    style={{
      padding: '10px',
      border: `2px solid ${data.color}`,
      borderRadius: data.shape === 'ellipse' ? '50%' : '5px',
      background: '#fff',
    }}
    title={data.tooltip} // Tooltip that displays custom parameters
    >
    <Handle type="target" position={Position.Left} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Right} />
  </div>
  );

  const nodeTypes = {
    custom: CustomNode,
  };
  
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState<number>(1);
  const [nodeTypeCount, setNodeTypeCount] = useState<Record<string, number>>({
    vectorDB: 0,
    llm: 0,
    query: 0,
    postRetrieval: 0,
    evaluation: 0,
  });
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('vectorDB');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [customParams, setCustomParams] = useState<Record<string, any>>({});
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onConnect = (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds));

  const onNodesChange = (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds));

  const addNode = () => {
    const selectedNodeStyle = predefinedNodeTypes['vectorDB'];

    // Initialize customParams with default values
    const initialParams: Record<string, any> = {};
    selectedNodeStyle.parameters.forEach((param) => {
      initialParams[param.name] = param.defaultValue;
    });

    setCustomParams(initialParams);

    setShowDialog(true);
  };

  const handleAddNodeConfirm = () => {
    setShowDialog(false);

    const lastNode = nodes[nodes.length - 1];
    const newNodeId = nodeIdCounter.toString();
    const selectedNodeStyle = predefinedNodeTypes[selectedNodeType];

    // Increment the count for the selected node type
    const newNodeCount = (nodeTypeCount[selectedNodeType] || 0) + 1;
    setNodeTypeCount((prevCounts) => ({
      ...prevCounts,
      [selectedNodeType]: newNodeCount,
    }));

    // Calculate the new node position
    const newNodeX = lastNode ? lastNode.position.x + 200 : 50;
    const newNodeY = lastNode ? lastNode.position.y : 50;
    
    // Set the label with the count only if more than one node of the same type exists
    const nodeLabel = newNodeCount > 1 ? `${selectedNodeStyle.label} ${newNodeCount}` : selectedNodeStyle.label;

    const finalParams = { ...customParams };
    selectedNodeStyle.parameters.forEach((param) => {
      if (!(param.name in customParams)) {
        finalParams[param.name] = param.defaultValue;
      }
    });

    // Construct tooltip from custom parameters
    const tooltip = Object.entries(finalParams)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      data: {
        label: nodeLabel,
        color: selectedNodeStyle.color,
        shape: selectedNodeStyle.shape,
        tooltip: tooltip,
        parameters: { ...finalParams },
      },
      position: { x: newNodeX, y: newNodeY },
    };

    setNodes((nds) => [...nds, newNode]);

    // Connect to the previous node if it exists
    if (nodes.length > 0) {
      const newEdge: Edge = {
        id: `e${nodeIdCounter - 1}-${newNodeId}`,
        source: (nodeIdCounter - 1).toString(),
        target: newNodeId,
        markerEnd: {
          type: MarkerType.Arrow,
          width: 20, // Adjust the width of the arrow marker
          height: 20, // Adjust the height of the arrow marker
        },
        style: { strokeWidth: 2 },
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    setNodeIdCounter(nodeIdCounter + 1);

    // Re-center the graph after adding a node
    if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView();
    }
  };


  const saveGraph = () => {
    const data = JSON.stringify({ nodes, edges });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const loadGraph = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setCustomParams((prevParams) => ({
      ...prevParams,
      [paramName]: value,
    }));
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setCustomParams(node.data);
      setShowDialog(true);
    }
  };

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setNodeIdCounter(1);
    setNodeTypeCount({ vectorDB: 0, llm: 0, query: 0, postRetrieval: 0, evaluation: 0, });
  };
  

  return (
    <AppLayout>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Custom RAG Pipeline</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Create and Deploy a RAG Pipeline
        </Title>
      </PageSection>
      <div className="rag-pipeline-constructor" ref={reactFlowWrapper}>
        <Button variant="primary" type="button" onClick={addNode}>
            Add RAG Stage
          </Button>
        <Button variant="primary" type="button" onClick={saveGraph} style={{ marginLeft: '10px' }}>
            Save Pipeline
          </Button>
        <Button variant="primary" type="button"
        onClick={() => document.getElementById('loadFileInput')?.click()}
        style={{ marginLeft: '10px' }}>
            Load Pipeline
        </Button>
        <input
          id="loadFileInput"
          type="file"
          accept=".json"
          onChange={loadGraph}
          style={{ display: 'none' }}
        />
        <Button variant="primary" type="button" style={{ marginLeft: '10px' }}>Deploy Pipeline</Button>
        <Button variant="primary" type="button" onClick={clearGraph} style={{ marginLeft: '10px' }}>Clear</Button>

        
      {showDialog && (
        <div className="modal-overlay">
          <div className="dialog">
            <h3>Select RAG Stage Type</h3>
            <select
              value={selectedNodeType}
              onChange={(e) => {
                setSelectedNodeType(e.target.value as NodeType);
                setCustomParams({});
              }}
            >
              {Object.keys(predefinedNodeTypes).map((key) => (
                <option key={key} value={key}>
                  {predefinedNodeTypes[key as NodeType].label}
                </option>
              ))}
            </select>

            <div style={{ marginTop: '20px' }}>
              {predefinedNodeTypes[selectedNodeType].parameters.map((param) => (
                <div key={param.name} style={{ marginBottom: '10px' }}>
                  <label>{param.name}: </label>
                  {param.type === 'string' && (
                    <input
                      type="text"
                      value={customParams[param.name] ?? param.defaultValue}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    />
                  )}
                  {param.type === 'boolean' && (
                    <input
                      type="checkbox"
                      checked={customParams[param.name] ?? param.defaultValue}
                      onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                    />
                  )}
                  {param.type === 'enum' && (
                    <select 
                    value={customParams[param.name] ?? param.defaultValue}
                    onChange={(e) => handleParameterChange(param.name, e.target.value)}>
                      {param.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px' }}>
              <button onClick={handleAddNodeConfirm}>Ok</button>
              <button onClick={() => setShowDialog(false)} style={{ marginLeft: '10px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
        <div style={{ height: 500, border: '1px solid #ccc', marginBottom: '20px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            onInit={(instance) => (reactFlowInstance.current = instance)}
            nodeTypes={nodeTypes}
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
