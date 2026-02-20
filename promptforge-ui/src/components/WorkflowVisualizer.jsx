import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Card, CardContent, Avatar, Accordion, AccordionSummary, AccordionDetails, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RuleIcon from '@mui/icons-material/Rule';
import StyleIcon from '@mui/icons-material/Style';
import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import GavelIcon from '@mui/icons-material/Gavel';
import PublicIcon from '@mui/icons-material/Public'; // Icon for Research

const NODE_METADATA = {
    research: { title: "Fact-Check Research", desc: "Verifying facts via SearXNG & Tavily to ground the prompt.", icon: <PublicIcon /> },
    decompose: { title: "Decomposition Analysis", desc: "Breaking down the user's idea into its core components.", icon: <SearchIcon /> },
    retrieve_examples: { title: "Contextual Retrieval", desc: "Searching for inspiring, high-quality examples.", icon: <PsychologyIcon /> },
    generate_strategies: { title: "Strategy Exploration", desc: "Brainstorming diverse strategies to improve the prompt.", icon: <RuleIcon /> },
    evaluate_strategies: { title: "Critic's Evaluation", desc: "Selecting the single most effective path forward.", icon: <GavelIcon /> },
    design_output_format: { title: "Dynamic Output Formatting", desc: "Architecting the perfect output structure.", icon: <StyleIcon /> },
    synthesize: { title: "Guardian Synthesis", desc: "Assembling a candidate prompt for final review.", icon: <BuildIcon /> },
    run_perplexity_council: { title: "Council Review", desc: "Convening a multi-model council for peer-review.", icon: <PeopleIcon /> },
    run_cross_provider_council: { title: "Council Review", desc: "Convening a multi-model council for peer-review.", icon: <PeopleIcon /> },
    final_polish: { title: "Master Editor Polish", desc: "Synthesizing critic feedback into a final, polished prompt.", icon: <EditIcon /> },
    finalize_no_council: { title: "Finalizing Prompt", desc: "Skipping council and using the Guardian's prompt.", icon: <CheckCircleIcon /> }
};

// Update Order to include Research first
const NODE_ORDER = ['research', 'decompose', 'retrieve_examples', 'generate_strategies', 'evaluate_strategies', 'design_output_format', 'synthesize'];

const Node = ({ nodeKey, data, isLast, isProcessing, nodeRef }) => {
    const [expanded, setExpanded] = useState(false);
    const meta = NODE_METADATA[nodeKey];

    // Safely handle missing metadata to prevent crashes
    if (!meta) return null;

    useEffect(() => {
        if (isProcessing) setExpanded(true);
    }, [isProcessing]);

    let displayData = data;
    
    // Custom data formatting for specific nodes
    if (nodeKey === 'generate_strategies') {
        displayData = { 
            strategies_generated: data?.strategies?.length || 0, 
            status: "Strategies sent to Critic for evaluation." 
        };
    } else if (nodeKey === 'evaluate_strategies') {
        displayData = { 
            chosen_strategy: data?.best_strategy, 
            critique: data?.critique 
        };
    } else if (nodeKey === 'research') {
        displayData = {
            summary: data?.research_summary,
            sources_count: data?.research_sources?.length || 0,
            sources: data?.research_sources
        };
    }

    return (
        <Box sx={{ position: 'relative', pl: 5 }} ref={nodeRef}>
            {!isLast && <Box sx={{ position: 'absolute', top: '28px', left: '22px', height: 'calc(100% + 16px)', borderLeft: '2px dashed', borderColor: 'divider' }} />}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ 
                    bgcolor: isProcessing ? 'primary.main' : 'grey.700', 
                    zIndex: 1, 
                    mr: 2, 
                    boxShadow: isProcessing ? `0 0 12px 2px #667eea` : 'none', 
                    animation: isProcessing ? 'pulse 2s infinite' : 'none' 
                }}>
                    {meta.icon}
                </Avatar>
                <Box>
                    <Typography variant="h6">{meta.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{meta.desc}</Typography>
                </Box>
            </Box>
            <Card variant="outlined" sx={{ ml: '56px', borderColor: isProcessing ? 'primary.main' : 'divider' }}>
                <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} sx={{ '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" color="text.secondary">
                            {isProcessing ? 'Processing...' : 'View Details'}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: 'action.hover', p: 2, borderRadius: 1, maxHeight: 300, overflow: 'auto', fontSize: '0.8rem' }}>
                            {JSON.stringify(displayData, null, 2)}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Card>
        </Box>
    );
};

const RouterNode = ({ decision }) => (
    <Box sx={{ position: 'relative', pl: 5, my: 2 }}>
        <Box sx={{ position: 'absolute', top: '28px', left: '22px', height: 'calc(100% + 16px)', borderLeft: '2px dashed', borderColor: 'divider' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', zIndex: 1, mr: 2 }}><AltRouteIcon /></Avatar>
            <Box>
                <Typography variant="h6">Council Router</Typography>
                <Typography variant="body2" color="text.secondary">Decision point for quality assurance.</Typography>
            </Box>
        </Box>
        <Card variant="outlined" sx={{ ml: '56px', p: 2, borderColor: 'secondary.main' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Decision: <Chip label={decision} color="secondary" /></Typography>
        </Card>
    </Box>
);

const CriticNode = ({ critique }) => (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{critique.critic}</Typography>
                <Chip label={`Score: ${critique.score}/10`} size="small" color={critique.score > 7 ? "success" : "warning"} variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary">"{critique.critique}"</Typography>
        </CardContent>
    </Card>
);

const CouncilSubFlow = ({ councilType, critiques, isProcessing }) => {
    const meta = NODE_METADATA[councilType];
    // Safety check for metadata
    if (!meta) return null;

    return (
        <Box sx={{ position: 'relative', pl: 5 }}>
            <Box sx={{ position: 'absolute', top: '28px', left: '22px', height: 'calc(100% + 16px)', borderLeft: '2px dashed', borderColor: 'divider' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', zIndex: 1, mr: 2, boxShadow: isProcessing ? `0 0 12px 2px #667eea` : 'none', animation: isProcessing ? 'pulse 2s infinite' : 'none' }}>{meta.icon}</Avatar>
                <Box>
                    <Typography variant="h6">{meta.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{meta.desc}</Typography>
                </Box>
            </Box>
            <Card variant="outlined" sx={{ ml: '56px', p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Received Feedback:</Typography>
                {critiques && critiques.map((crit, index) => <CriticNode key={index} critique={crit} />)}
            </Card>
        </Box>
    );
};

export default function WorkflowVisualizer({ agentData, isLoading }) {
    const activeNodeRef = useRef(null);
    
    // Check if agentData exists
    if (!agentData) return null;

    const completedNodes = Object.keys(agentData);
    
    // Determine current node. If loading, it's the last one. If done (isLoading false), there is no "processing" node.
    const currentProcessingNode = isLoading && completedNodes.length > 0 ? completedNodes[completedNodes.length - 1] : null;
    
    const councilType = completedNodes.find(k => k.includes('_council'));
    const wasCouncilRun = !!councilType;

    useEffect(() => {
        if (activeNodeRef.current) {
            activeNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentProcessingNode]);

    return (
        <Box>
            <style>{`@keyframes pulse {0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); } 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }}`}</style>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>AI Reasoning Workflow</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NODE_ORDER.map((key, index) => {
                    if (!agentData[key]) return null;
                    const isProcessing = currentProcessingNode === key;
                    return <Node key={key} nodeKey={key} data={agentData[key].data} isLast={false} isProcessing={isProcessing} nodeRef={isProcessing ? activeNodeRef : null} />;
                })}

                {wasCouncilRun && agentData[councilType] && (
                    <>
                        <RouterNode decision={`Convene ${councilType.includes('cross') ? 'Cross-Provider' : 'Perplexity'} Council`} />
                        <CouncilSubFlow councilType={councilType} critiques={agentData[councilType].data.critiques} isProcessing={currentProcessingNode === councilType} />
                    </>
                )}
                
                {agentData['final_polish'] && <Node key="final_polish" nodeKey="final_polish" data={{ status: "Prompt polished based on council feedback." }} isLast={true} isProcessing={currentProcessingNode === 'final_polish'} nodeRef={currentProcessingNode === 'final_polish' ? activeNodeRef : null} />}
                
                {agentData['finalize_no_council'] && <Node key="finalize_no_council" nodeKey="finalize_no_council" data={{ status: "Guardian prompt is now the final prompt." }} isLast={true} isProcessing={currentProcessingNode === 'finalize_no_council'} />}
            </Box>
        </Box>
    );
}

WorkflowVisualizer.propTypes = {
    agentData: PropTypes.object.isRequired,
    isLoading: PropTypes.bool.isRequired,
};